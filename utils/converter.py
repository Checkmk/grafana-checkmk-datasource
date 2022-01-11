#!/usr/bin/env python3
import argparse
import json


def cli_options():
    parser = argparse.ArgumentParser(description="Grafana JSON Model updater")

    parser.add_argument("json_file", help="File exported from Grafana Dashboard")
    parser.add_argument(
        "-o", "--datasource-old", help="Name of the OLD Grafana Connector Version 1.x"
    )
    parser.add_argument(
        "-n", "--datasource-new", help="Name of the NEW Grafana Connector Version 2.x"
    )
    return parser


def update_host_tags(target):
    host_tag_obj = {"group": "grp", "value": "val", "op": "op"}
    host_tags = [key for key in target if key.startswith("filter")]
    target["context"]["host_tags"] = {}
    for key in host_tags:
        nr = key[6]
        obj = key[7:]
        if value := target.pop(key):
            new_key = f"host_tag_{nr}_{host_tag_obj[obj]}"
            target["context"]["host_tags"][new_key] = value


def main():
    args = cli_options().parse_args()
    with open(args.json_file) as fd:
        dash = json.load(fd)

    for panel in dash["panels"]:
        if panel.get("datasource") == args.datasource_old:
            for target in panel["targets"]:
                update_host_tags(target)

                if host := target.pop("host", None):
                    target["context"]["host"] = {"host": host}
                if host := target.pop("hostregex", None):
                    target["context"]["hostregex"] = {"host_regex": host}

                if service := target.pop("service", None):
                    target["context"]["service"] = {"service": service}
                if service := target.pop("serviceregex", None):
                    target["context"]["serviceregex"] = {"service_regex": service}

                if service := target.pop("site", None):
                    target["context"]["siteopt"] = {"site": service}

                if presentation := target.pop("presentiation", None):
                    target["params"]["presentation"] = presentation

    print(json.dumps(dash))


if __name__ == "__main__":
    main()
