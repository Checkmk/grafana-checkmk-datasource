#!/usr/bin/env python3

from datetime import datetime
import argparse
import json
import pprint
import sqlite3
import urllib.request as rq


def cli_options():
    parser = argparse.ArgumentParser(description="Grafana JSON Model updater")

    parser.add_argument("-db", "--db-file", help="Grafana sqlite database")
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


def config_set(target, keys, value, label=""):
    nested_set(target, keys, value)
    nested_set(
        target,
        ["params", "selections"] + keys,
        {"value": value, "label": label or value, "isDisabled": False},
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
    if all(x.endswith("op") for x in target["context"]["host_tags"].keys()):
        del target["context"]["host_tags"]
        del target["params"]["selections"]["context"]["host_tags"]


def update_context(target):
    update_host_tags(target)
    target.pop("format", None)
    target.pop("usehostregex", None)
    if host := target.pop("host", None):
        config_set(target, ["context", "host", "host"], host)
    if host := target.pop("hostregex", None):
        nested_set(target, ["context", "hostregex", "host_regex"], host)

    if service := target.pop("service", None):
        config_set(target, ["context", "service", "service"], service)
    if service := target.pop("serviceregex", None):
        nested_set(target, ["context", "serviceregex", "service_regex"], service)

    if site := target.pop("site", None):
        config_set(target, ["context", "siteopt", "site"], site)


def extract_single_info(context):
    return {
        "site": context.get("siteopt", {}).get("site", ""),
        "host_name": context.get("host", {}).get("host", ""),
        "service_description": context.get("service", {}).get("service", ""),
    }


def update_graph(query_graph, target):
    mode = target.pop("mode", "")
    metric_id = [int(x) for x in target.pop("metric", "").split(".") if x]
    graph_idx = target.pop("graph", 0)
    presentation = target.pop("presentiation", "lines")
    if combined_graph_name := target.pop("combinedgraph", None):
        config_set(target, ["params", "graph_name"], combined_graph_name)
        target["params"]["presentation"] = presentation
        return

    graph = query_graph(target["context"])
    if mode == "graph" and graph_idx < len(graph):
        graph_name = graph[graph_idx]["specification"][1]["graph_id"]
        graph_title = graph[graph_idx]["title"]
        config_set(target, ["params", "graph_name"], graph_name, graph_title)
    elif mode == "metric" and len(metric_id) == 2:
        graph_idx, metric_idx = metric_id
        if graph_idx < len(graph) and metric_idx < len(graph[graph_idx]["metrics"]):
            metric = graph[graph_idx]["metrics"][metric_idx]
            expression = metric["expression"]
            if expression[0] == "rrd":
                nested_set(target, ["params", "graphMode"], "metric")
                config_set(
                    target, ["params", "graph_name"], expression[4], metric["title"]
                )
    else:
        config_set(target, ["params", "graph_name"], "", "Not available")


def get_datasource_configs(cursor):
    for ds, name, json_data in cursor.execute(
        "select type, name, json_data from data_source"
    ):
        if ds in ["checkmk-datasource", "tribe-29-checkmk-datasource"]:
            yield name, {**json.loads(json_data), "name": name, "ds": ds}


def query(conf):
    def _query(context):
        req = rq.Request(
            conf["url"]
            + "/check_mk/webapi.py?_username=%s&_secret=%s&action=get_graph_recipes"
            % (conf["username"], conf["secret"])
        )
        spec = {"specification": ["template", extract_single_info(context)]}
        response = rq.urlopen(req, ("request=%s" % json.dumps(spec)).encode("utf-8"))
        if response.status == 200:
            return json.loads(response.read())["result"]
        return []

    return _query


def update_dashboard(data, args, query_graph):
    dash = json.loads(data)

    for panel in dash["panels"]:
        if panel.get("datasource") == args.datasource_old:
            panel["datasource"] = args.datasource_new

            for target in panel["targets"]:
                update_context(target)
                update_graph(query_graph, target)

    return dash


def main():
    args = cli_options().parse_args()
    con = sqlite3.connect(args.db_file)
    cur = con.cursor()
    datasource_config = dict(get_datasource_configs(cur))
    query_graph = query(datasource_config[args.datasource_old])

    for did, data, creator in cur.execute("select id, data, created_by from dashboard"):
        dash = update_dashboard(data, args, query_graph)
        version = dash["version"]
        dash["version"] += 1
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            "insert into dashboard_version (dashboard_id, parent_version, restored_from, version,  created, created_by, message, data) values(?,?,?,?,?,?,?,?)",
            (
                did,
                version,
                0,
                dash["version"],
                now,
                creator,
                "Checkmk connector update",
                json.dumps(dash),
            ),
        )
        cur.execute(
            """UPDATE dashboard SET
            data = ?, version = ?, updated = ?
            WHERE id = ?""",
            (json.dumps(dash), dash["version"], now, did),
        )
        con.commit()
    con.close()


if __name__ == "__main__":
    main()
