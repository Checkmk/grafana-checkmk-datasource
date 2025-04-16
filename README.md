# Checkmk data source

[![Grafana 9.5](https://img.shields.io/badge/Grafana-9.5-orange)](https://www.grafana.com)
[![Grafana 10.2](https://img.shields.io/badge/Grafana-10.2-orange)](https://www.grafana.com)
[![Checkmk data source for Checkmk Cloud & MSP](https://img.shields.io/badge/dynamic/json?color=blue&label=Checkmk%20for%20Cloud%20Edition&query=%24.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fcheckmk-cloud-datasource)](https://grafana.com/grafana/plugins/checkmk-cloud-datasource)
[![Checkmk unsigned data source](https://img.shields.io/badge/dynamic/json?color=blue&label=Checkmk&query=tag_name&url=https%3A%2F%2Fapi.github.com%2Frepos%2Ftribe29%2Fgrafana-checkmk-datasource%2Freleases%2Flatest)](https://github.com/Checkmk/grafana-checkmk-datasource)
[![CI](https://github.com/Checkmk/grafana-checkmk-datasource/actions/workflows/ci.yml/badge.svg?branch=main&event=schedule)](https://github.com/Checkmk/grafana-checkmk-datasource/actions/workflows/ci.yml?query=event%3Aschedule)


![Checkmk Grafana Data Source Plugin](https://github.com/checkmk/grafana-checkmk-datasource/raw/ebf24142922ccce5cc5649aa4809d1c19d55958f/grafana-checkmk-datasource.png)
## Introduction

This [data source][2] plugin for [Grafana][1] allows to address Checkmk as source and to display individual metrics in Grafana.

## Requirements

To make use of the plugin, you need to take care the correct versions are installed. You need to match both, the Grafana and the Checkmk version:

- **Grafana 9.5.15 or higher** Current and previous major version of Grafana
- **Checkmk Cloud or Checkmk MSP 2.2.0 or higher** for the signed plugin available from [Grafana][6]
- **Checkmk 2.2.0 or higher** for the unsigned plugin available from [Github][8]

## Installing the plug-in

The signed plug-in can be installed from the [Grafana marketplace][6] or by using the `grafana-cli`:

```bash
grafana-cli plugins install checkmk-cloud-datasource
```

For the installation of the unsigned plugin, please take a look at the official [Checkmk User Guide][3].

## Official documentation

For detailed information regarding the installation, configuration and usage,
please consult the official [Checkmk User Guide][3].

## Further information

See [CHANGELOG.md][4] for information about updating from previous
versions.

See [DEVELOPMENT.md][5] for information about how to test, build and
release this software.

## License

This project is using the [Apache-2.0 license][7].

[1]: https://grafana.com/grafana/
[2]: https://grafana.com/docs/grafana/latest/datasources/
[3]: https://docs.checkmk.com/latest/en/grafana.html
[4]: https://github.com/checkmk/grafana-checkmk-datasource/blob/main/CHANGELOG.md
[5]: https://github.com/checkmk/grafana-checkmk-datasource/blob/main/DEVELOPMENT.md
[6]: https://grafana.com/grafana/plugins/checkmk-cloud-datasource/
[7]: https://github.com/checkmk/grafana-checkmk-datasource/blob/main/LICENSE
[8]: https://github.com/Checkmk/grafana-checkmk-datasource
