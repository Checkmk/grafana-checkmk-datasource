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


def nested_set(target, keys, value):
    for key in keys[:-1]:
        target = target.setdefault(key, {})
    target[keys[-1]] = value


def config_set(target, keys, value):
    nested_set(target, keys, value)
    nested_set(
        target,
        ["params", "selections"] + keys,
        {"value": value, "label": value, "isDisabled": False},
    )


def update_host_tags(target):
    host_tag_obj = {"group": "grp", "value": "val", "op": "op"}
    host_tags = [key for key in target if key.startswith("filter")]
    target["context"]["host_tags"] = {}
    for key in host_tags:
        nr = key[6]
        obj = key[7:]
        if value := target.pop(key):
            new_key = f"host_tag_{nr}_{host_tag_obj[obj]}"
            config_set(target, ["context", "host_tags", new_key], value)


def main():
    args = cli_options().parse_args()
    with open(args.json_file) as fd:
        dash = json.load(fd)


    for panel in dash["panels"]:
        if panel.get("datasource") == args.datasource_old:
            panel["datasource"] = args.datasource_new

            for target in panel["targets"]:
                update_host_tags(target)

                if host := target.pop("host", None):
                    config_set(target, ["context", "host", "host"], host)
                if host := target.pop("hostregex", None):
                    nested_set(target, ["context", "hostregex", "host_regex"], host)

                if service := target.pop("service", None):
                    config_set(target, ["context", "service", "service"], service)
                if service := target.pop("serviceregex", None):
                    nested_set(
                        target, ["context", "serviceregex", "service_regex"], service
                    )

                if site := target.pop("site", None):
                    config_set(target, ["context", "siteopt", "site"], site)

                if combined := target.pop("combinedgraph", None):
                    target["params"]["graph_name"] = combined
                if presentation := target.pop("presentiation", None):
                    target["params"]["presentation"] = presentation

    print(json.dumps(dash))


if __name__ == "__main__":
    main()
