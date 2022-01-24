#!/usr/bin/env python3
import argparse
import json
import sqlite3


def cli_options():
    parser = argparse.ArgumentParser(description="Grafana JSON Model updater")

    parser.add_argument("json_file", help="File exported from Grafana Dashboard")
    parser.add_argument(
        "-o", "--datasource-old", help="Name of the OLD Grafana Connector Version 1.x"
    )
    parser.add_argument(
        "-n", "--datasource-new", help="Name of the NEW Grafana Connector Version 2.x"
    )
    parser.add_argument(
        "-t",
        "--new-dashboard-title",
        help="Rename dashboard. If not set add NEW suffix",
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
    con = sqlite3.connect(args.json_file)
    cur = con.cursor()
    row = list(cur.execute("select data from dashboard where slug = 'cmk'"))
    dash = json.loads(row[0][0])

    # if title := args.new_dashboard_title:
    #     dash["title"] = title
    # else:
    dash["title"] += " NEW"
    dash["uid"] += "1"

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

                mode = target.pop("mode", "")
                metric_id = target.pop("metric", "")
                graph_id = str(target.pop("graph", "0"))
                combined_graph_name = target.pop("combinedgraph", None)
                if mode == "metric":
                    nested_set(target, ["params", "graphMode"], "metric")
                    nested_set(target, ["params", "graph_name"], metric_id)
                elif mode == "graph":
                    nested_set(target, ["params", "graph_name"], graph_id)
                elif combined_graph_name:
                    config_set(target, ["params", "graph_name"], combined_graph_name)

                if presentation := target.pop("presentiation", None):
                    target["params"]["presentation"] = presentation

    cur.execute(
        "update dashboard set data = '%s'  where slug = 'cmk-new'" % json.dumps(dash)
    )
    con.commit()
    con.close()

    print(json.dumps(dash))


if __name__ == "__main__":
    main()
