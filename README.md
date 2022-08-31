# Checkmk's Grafana Data Source Plugin

![CI](https://github.com/tribe29/grafana-checkmk-datasource/actions/workflows/ci.yml/badge.svg)

This is a [Grafana][1] [data source][2] plugin for visualizing Checkmk metrics
in Grafana.

The plugin requires Checkmk >= 2.1.0 and Grafana >= 8.0  
(It is possible query data from Checkmk >= 2.0.0p20 but host and service
dropdowns are not constrained by other active filters and single metric graphs
do not work with Checkmk Raw Edition)

All Checkmk Editions are supported by this plugin, but with different query
interface as the Enterprise Edition has a more comprehensive filtering engine.

Please consult the chapter ["Integrating Checkmk in Grafana"][3] in the
official Checkmk documentation on how to use this plugin.

![Checkmk Grafana Data Source Plugin](https://github.com/tribe29/grafana-checkmk-datasource/raw/ebf24142922ccce5cc5649aa4809d1c19d55958f/grafana-checkmk-datasource.png)

See [CHANGELOG.md][4] for information about updating from previous
versions.

See [DEVELOPMENT.md][5] for information about how to test, build and
release this software.

[1]: https://grafana.com/grafana/
[2]: https://grafana.com/docs/grafana/latest/datasources/
[3]: https://docs.checkmk.com/latest/en/grafana.html
[4]: https://github.com/tribe29/grafana-checkmk-datasource/blob/main/CHANGELOG.md
[5]: https://github.com/tribe29/grafana-checkmk-datasource/blob/main/DEVELOPMENT.md
