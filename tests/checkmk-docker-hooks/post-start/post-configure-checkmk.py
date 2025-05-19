#!/usr/bin/python3
# Copyright (C) 2024 Checkmk GmbH - License: GNU General Public License v2
# This file is part of Checkmk (https://checkmk.com). It is subject to the terms and
# conditions defined in the file COPYING, which is part of this source code package.

import argparse
import glob
import json
import logging
import os
import re
import subprocess
import sys
import textwrap
import time
from http.client import HTTPConnection
from pathlib import Path
from typing import Dict, Iterator, List, Mapping, NamedTuple, Sequence, TypedDict, Union

import requests

CMK_ADMIN="cmkadmin"
CMK_PASS="abskjfdalkdhjbld"
CMK_AUITOMATION_USER="automation"
CMK_SITE="cmk"
CMK_PORT=5000
HOME_DIR=os.path.dirname(os.path.abspath(__file__))
HOSTNAME=["localhost_grafana0", "localhost_grafana1"]

class BulkHost(NamedTuple):
    name: str
    folder: str
    attributes: Dict[str, str] = {}


class Site(NamedTuple):
    name: str
    called_as_site_user: bool

    def args_for_command(self, command: str) -> List[str]:
        """
        if script is executed from site context, just wrap command in bash.
        if script is executed from "normal" user context, use sudo to switch users.
        """
        return (
            []
            if self.called_as_site_user
            else ["sudo", "--login", "-u", self.name, "--"]
        ) + ["bash", "-c", command]


class HostResponse(TypedDict):
    # this is incomplete
    id: str


class CreateConfig(NamedTuple):
    folder_name: str
    folder_title: str
    rule_name: str
    rule_value: str
    source_folder: str  # relative to zeug_cmk repo
    host_attributes: Dict[str, str]
    source_destination: str


class Printer:
    RESET = "\033[0m"
    RED = 31
    GREEN = 32
    BLUE = 34
    YELLOW = 33
    LIGHT_BLUE = 94

    def __init__(self, level: int):
        self._level = level
        if not sys.stdout.isatty() and level == 0:
            # level = 0 is the default, only then we want to automatically downgrade
            self._level = -1

    def _print_colored(self, message: str, color: int | None = None) -> None:
        if color is not None and self._level > -1:
            print(f"\033[{color}m{message}{self.RESET}")
        else:
            print(message)

    def indent(self, message: str) -> str:
        if self._level > -1:
            return textwrap.indent(message, "   ")
        else:
            return message

    def success(self, message: str) -> None:
        if self._level < 0:
            return
        self._print_colored(message, self.GREEN)

    def error(self, message: str) -> None:
        if self._level < 0:
            print(message, file=sys.stderr)
            return
        self._print_colored(message, self.RED)

    def headline(self, message: str) -> None:
        if self._level < 0:
            return
        self._print_colored(message, self.YELLOW)

    def info(self, message: str) -> None:
        if self._level < 0:
            return
        self._print_colored(message, self.LIGHT_BLUE)

    def debug(self, message: str) -> None:
        if self._level < 0:
            return
        self._print_colored(message, self.LIGHT_BLUE)

    def print(self, message: str) -> None:
        self._print_colored(message)


def create_from(
    config: CreateConfig,
    source_files: list[Path],
    api: "API",
    site: Site,
    printer: Printer,
) -> None:
    printer.headline("## create folder")
    # TODO: we assume that the rule will exist if the folder exists, but this might not be true.
    if api.get_folder(config.folder_name) is None:
        printer.info(printer.indent(f"create folder: {config.folder_name}"))
        api.create_folder(config.folder_name, config.folder_title)
        printer.info(printer.indent(f"configure folder {config.folder_name}"))
        api.create_rule(
            name=config.rule_name,
            value=config.rule_value,
            folder=config.folder_name,
        )
    else:
        printer.success(printer.indent(f"folder {config.folder_name} already exists."))

    printer.headline("## creating hosts")
    existing_hosts = set([h["id"] for h in api.get_hosts(config.folder_name)])

    hosts_to_create: List[BulkHost] = []
    all_hosts: List[str] = []
    for path in source_files:
        host_name = path.name
        all_hosts.append(host_name)
        if host_name in existing_hosts:
            printer.success(printer.indent(f"host {host_name} already exists"))
            continue
        hosts_to_create.append(
            BulkHost(
                host_name,
                config.folder_name,
                attributes={
                    "tag_address_family": "no-ip",
                    **config.host_attributes,
                },
            )
        )

    if hosts_to_create:
        printer.info(
            printer.indent(
                f"creating hosts: {', '.join(h.name for h in hosts_to_create)}"
            )
        )
        api.bulk_create_hosts(hosts_to_create)

    printer.headline("## creating files")

    printer.info(printer.indent("make sure folder exists"))
    # not necessary for snmp walks, but does not hurt
    folder = Path(config.source_destination).parent
    with subprocess.Popen(
        site.args_for_command(f"mkdir -p {folder}"),
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
    ):
        pass

    for path in source_files:
        host_name = path.name
        printer.info(printer.indent(f"creating file for {host_name}"))
        with subprocess.Popen(
            site.args_for_command(
                f"tee {config.source_destination.format(host_name=host_name)}"
            ),
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
        ) as proc:
            proc.communicate(input=path.read_bytes())

    printer.headline("## discover services")
    api.bulk_discovery(all_hosts, printer)

    printer.headline("## activate changes")
    api.activate_changes(printer)


class API:
    def __init__(self, site: Site):
        username = CMK_ADMIN
        password = CMK_PASS
        port = CMK_PORT
        self._base_url = f"http://localhost:{port}/{site.name}/check_mk/api/v1"
        self._session = requests.session()
        self._session.headers["Authorization"] = f"Bearer {username} {password}"
        self._session.headers["Accept"] = "application/json"
        self._version = self.version()


    def _version_le_230(self) -> bool:
        return bool(re.match("^(2.3.0|2.2.0|2.1.0|2.0.0)", self._version))

    def _version_le_220(self) -> bool:
        return bool(re.match("^(2.2.0|2.1.0|2.0.0)", self._version))

    def _version_le_210(self) -> bool:
        return bool(re.match("^(2.1.0|2.0.0)", self._version))

    @classmethod
    def _get_href_from_links(cls, links: List[Dict[str, str]], name: str) -> str:
        for link in links:
            if link["rel"] == name:
                return link["href"]
        raise ValueError(f"could not find link named {name} in {links}")

    def _post(
        self,
        url: str,
        data: Mapping[
            str,
            Union[
                Mapping[str, Union[bool, str, List[str]]],
                str,
                bool,
                int,
                Sequence[Union[str, Mapping[str, Union[str, Mapping[str, str]]]]],
            ],
        ],
        *,
        headers: Mapping[str, str] = {},
        check_status_code: bool = True,
    ) -> requests.Response:
        resp = self._session.post(
            f"{self._base_url}{url}",
            json=data,
            headers=headers,
            timeout=5,
        )
        if check_status_code and resp.status_code != requests.codes.ok:
            raise RuntimeError(resp.json())
        return resp

    def _get(self, url: str) -> requests.Response:
        # this feels a bit hackish... introduced because links are absolute urls
        if not url.startswith("http://"):
            url = f"{self._base_url}{url}"
        resp = self._session.get(url, timeout=5)
        return resp

    def _delete (self, url: str) -> None:
        if not url.startswith("http://"):
            url = f"{self._base_url}{url}"
        try:
            resp = self._session.delete(url, timeout=5)

        except:
            ...
            
        return resp


    def version(self) -> str:
        resp = self._get("/version")
        resp.raise_for_status()
        return resp.json()["versions"]["checkmk"]

    def create_automation_user(self, username: str, secret: str) -> Dict[str, str]:
        return self._post(
            "/domain-types/user_config/collections/all",
            {
                "username": username,
                "fullname": username,
                "auth_option": {
                    "auth_type": "automation",
                    "secret": secret,
                },
                "roles": ["admin"],                
            },
        ).json()

    def delete_automation_user(self, username: str) -> None:
        self._delete(
            f"/objects/user_config/{username}"
        )

    def create_folder(self, folder_name: str, folder_title: str) -> Dict[str, str]:
        return self._post(
            "/domain-types/folder_config/collections/all",
            {
                "name": folder_name,
                "title": folder_title,
                "parent": "~",
            },
        ).json()

    def delete_folder (self, folder_path: str) -> None:
        return self._delete(f"/objects/folder_config/~{folder_path}?delete_mode=recursive")


    def get_folder(self, folder_name: str) -> Union[Dict[str, str], None]:
        resp = self._get(f"/objects/folder_config/~{folder_name}")
        if resp.status_code == requests.codes.NOT_FOUND:
            return None
        if resp.status_code != requests.codes.ok:
            try:
                message = resp.json()
            except json.decoder.JSONDecodeError:
                message = resp.text
            raise RuntimeError(message)
        return resp.json()

    def create_rule(self, *, name: str, value: str, folder: str) -> object:
        return self._post(
            "/domain-types/rule/collections/all",
            {
                "properties": {
                    "disabled": False,
                },
                "value_raw": value,
                "conditions": {},
                "ruleset": name,
                "folder": f"~{folder}",
            },
        ).json()

    def get_hosts(self, folder_name: str) -> list[HostResponse]:
        resp = self._get(f"/objects/folder_config/~{folder_name}/collections/hosts")
        return resp.json()["value"]

    def bulk_create_hosts(self, hosts: List[BulkHost]) -> None:
        return self._post(
            "/domain-types/host_config/actions/bulk-create/invoke?bake_agent=false",
            {
                "entries": [
                    {
                        "host_name": h.name,
                        "folder": f"~{h.folder}",
                        "attributes": h.attributes,
                    }
                    for h in hosts
                ],
            },
        ).json()

    def bulk_discovery(self, hosts: List[str], printer: Printer) -> None:
        request: dict[str, bool | int | list[str] | str | dict[str, bool]] = {
            "hostnames": hosts,
            "do_full_scan": True,
            "bulk_size": 20,
            "ignore_errors": True,
        }
        if self._version_le_220():
            request.update({"mode": "refresh"})
        else:
            request.update(
                {
                    "options": {
                        "monitor_undecided_services": True,
                        "remove_vanished_services": True,
                        "update_service_labels": True,
                    },
                }
            )

        result = self._post(
            "/domain-types/discovery_run/actions/bulk-discovery-start/invoke", request
        ).json()
        printer.info(printer.indent(result["title"]))
        if result["extensions"]["active"]:
            link = self._get_href_from_links(result["links"], "self")
            while True:
                result = self._get(link).json()

                logs_progress = (
                    result["extensions"]["logs"]["progress"]
                    if self._version_le_230()
                    else result["extensions"]["status"]["log_info"]["JobProgressUpdate"]
                )
                printer.info(
                    printer.indent("\n".join(logs_progress))
                )

                logs_result = (
                    result["extensions"]["logs"]["result"]
                    if self._version_le_230()
                    else result["extensions"]["status"]["log_info"]["JobResult"]
                )

                if logs_result:
                    printer.print(printer.indent("\n".join(logs_result)))

                state = (
                    result["extensions"]["state"]
                    if self._version_le_230()
                    else result["extensions"]["status"]["state"]
                )
                if state == "finished":
                    break
                time.sleep(1)

    def activate_changes(self, printer: Printer) -> None:
        result = self._post(
            "/domain-types/activation_run/actions/activate-changes/invoke",
            {
                "redirect": False,
                "sites": [],
                "force_foreign_changes": True,
            },
            headers={
                "If-Match": "*",
            },
            check_status_code=False,
        )
        if result.status_code == 422:
            printer.success(printer.indent("Nothing to activate"))
            return
        result.raise_for_status()
        link = self._get_href_from_links(result.json()["links"], "self")
        while True:
            result = self._get(link)
            result.raise_for_status()
            data = result.json()
            title = printer.indent(data["title"])
            printer.info(title)
            if self._version_le_210():
                if title.endswith("has completed."):
                    break
            else:
                if not data["extensions"]["is_running"]:
                    for change in data["extensions"]["changes"]:
                        printer.print(
                            printer.indent(f'{change["user_id"]} {change["text"]}')
                        )
                    break
            time.sleep(1)

def parse() -> tuple[argparse.ArgumentParser, argparse.Namespace]:
    parser = argparse.ArgumentParser(
        description="Create checkmk hosts from Agent Output\n\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-v",
        action="append_const",
        const=+1,
        dest="level",
        default=[0],
        help="more verbose",
    )
    subparsers = parser.add_subparsers()

    args = parser.parse_args()

    return parser, args


def create_automation_user (username: str, password: str, api: API, printer: Printer):
    printer.headline("## automation user")
        
    printer.info(printer.indent("delete current automation user if exists"))
    api.delete_automation_user(username)

    printer.info(printer.indent("create automation user"))
    api.create_automation_user(username, password)

    printer.info(printer.indent("activate changes"))
    api.activate_changes(printer)


def main() -> None:
    parser, args = parse()
    

    level = sum(args.level)
    if level >= 1:
        logging.basicConfig(level=logging.DEBUG)
        requests_log = logging.getLogger("requests.packages.urllib3")
        requests_log.setLevel(logging.DEBUG)
        requests_log.propagate = True
        HTTPConnection.debuglevel = 3

    printer = Printer(level)

    source_files = [ Path(HOME_DIR +'/' + hostname) for hostname in HOSTNAME ]
    site = Site(CMK_SITE, True)
    api = API(site)

    create_config = CreateConfig(
        folder_name="grafana",
        folder_title="grafana",
        rule_name="datasource_programs",
        rule_value="'cat ~/var/check_mk/agent_output/$HOSTNAME$'",
        source_folder="agent_output",
        host_attributes={
            "tag_agent": "cmk-agent",
        },
        source_destination="~/var/check_mk/agent_output/{host_name}",
    )

    api.delete_folder(create_config.folder_name)

    create_from(create_config, source_files, api, site, printer)

    create_automation_user (CMK_AUITOMATION_USER, CMK_PASS, api, printer)

if __name__ == "__main__":
    main()
