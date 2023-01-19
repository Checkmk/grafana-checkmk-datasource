# this file is started by executing `generate_random_rrd_data.sh`
# the docker entry-point-script will not start it directly because the
# execution permissions are missing.
# some paths are hard coded for usage in the checkmk docker container.

"""
Tool to create data in rrd files.
Paths are hard coded for usage inside of cmk docker container.

* using watchdog to wait for modification event to detect recent created rrd
  files, but after the configuration is written to the rrd files.
* as no old data can be inserted into rrd files, the rrd files are then
  recreated using the configuration of the original rrd files
* then random data for the previous 5 hours is inserted
* different random data generator (random, static, sine) are used to generate
  the data
* an internal list of modified files makes sure files are only updated once
"""


import math
import os
import random
import re
import time
from collections import defaultdict

import rrdtool
from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer


def random_random_function():
    choice = random.randint(0, 2)
    if choice == 0:
        value = random.randint(0, 500)
        return lambda x: value
    if choice == 1:
        return lambda x: random.random() * 100
    if choice == 2:
        offset = random.random()
        frequency = random.random()
        return lambda x: math.sin(offset + x / (1000.0 * (1 + frequency))) * 100
    raise Exception()


def clone(original_rrd, clone_rrd):
    info = rrdtool.info(original_rrd)

    metrics = set()
    for key, value in info.items():
        match = re.match(r"^ds\[([0-9]+)\]\.([^.]+)$", key)
        if match:
            id, ds_key = match.groups()
            metrics.add(id)
            if ds_key == "type" and value != "GAUGE":
                raise NotImplementedError(value)
            if ds_key == "minimal_heartbeat" and value != 8460:
                raise NotImplementedError(value)
    metrics_count = len(metrics)

    rra_info = defaultdict(dict)
    for key, value in info.items():
        match = re.match(r"^rra\[([0-9]+)\]\.([^.]+)$", key)
        if match:
            id, rra_key = match.groups()
            rra_info[id][rra_key] = value

    dss = []
    for i in range(1, metrics_count + 1):
        dss.append(f"DS:{i}:GAUGE:8460:U:U")  # assuming fixed value here, see above
    rras = []
    for id, rra_info in rra_info.items():
        cf = rra_info["cf"]
        xff = rra_info["xff"]
        rows = rra_info["rows"]
        steps = rra_info["pdp_per_row"]
        rras.append(f"RRA:{cf}:{xff}:{steps}:{rows}")

    rrdtool.create(
        clone_rrd,
        "--start",
        "0",
        "--step",
        "60",
        *dss,
        *rras,
    )

    return metrics_count


def modify_in_place(filename):
    filename_clone = "/tmp/clone.rrd"
    metrics_count = clone(filename, filename_clone)

    random.seed(filename)

    now = int(time.time())
    randoms = [random_random_function() for _ in range(metrics_count)]
    for t in range(now - 5 * 60 * 60, now, 60):
        metrics = ":".join(str(r(t)) for r in randoms)
        rrdtool.update(filename_clone, f"{int(t)}:{metrics}")

    os.rename(filename_clone, filename)

    # with open("original.json", "w") as original:
    #     json.dump(rrdtool.info("Check_MK.rrd"), original, sort_keys=True, indent=4)
    # with open("clone.json", "w") as clone_fo:
    #     json.dump(rrdtool.info("clone.rrd"), clone_fo, sort_keys=True, indent=4)


class Handler(PatternMatchingEventHandler):
    def __init__(self, *arg, **kwargs):
        super().__init__(*arg, **kwargs)
        self.seen_filenames = set()

    def on_modified(self, event):
        filename = event.src_path
        if filename in self.seen_filenames:
            return
        self.seen_filenames.add(filename)
        print(f"[GRRD] {filename}")
        modify_in_place(filename)


def main():
    # hooks are called sync, so we have to fork
    if os.environ.get("GRRD_FORK"):
        pid = os.fork()
        if pid != 0:
            # parent process
            return
    # forking done

    observer = Observer()
    observer.schedule(
        Handler(patterns=["*.rrd"], ignore_directories=True),
        "/omd/sites/cmk/var/check_mk/rrd/",
        recursive=True,
    )
    observer.start()
    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("graceful shutdown")
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
