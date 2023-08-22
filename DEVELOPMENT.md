# Development Guide

This document contains information on how to build and release the plugin. If
you are looking to use the plugin please head over to [README.md](README.md).

## Building the plugin

1. Install dependencies

```BASH
yarn install --immutable
```

2. Build plugin in development mode or run in watch mode

```BASH
yarn dev
```

3. Build plugin in production mode

```BASH
yarn build
```

## Maintenance

Code formatting

```BASH
yarn pretty
```

Update dependencies

https://grafana.com/developers/plugin-tools/migration-guides/update-create-plugin-versions

```BASH
npx @grafana/create-plugin@latest update
yarn install
yarn upgrade
yarn pretty
```

## Release

- update dependencies
- create pull request:
  - adapt version in package.json to `X.Y.Z`
  - add section in CHANGELOG.md: `## X.Y.Z`
- merge pull request into main branch
- tag commit in the main branch with `vX.Y.Z`
- save release draft on GitHub

## E2E Tests

There are serval ways to run the e2e tests.
Make sure to have an up to date `dist/` folder using `yarn build`.

### Local development use case

```BASH
cd tests/
docker compose up -d checkmk grafana
yarn run cypress open
```

This will show you a nice interactive GUI to run and debug your E2E tests.
See the official [docs](https://docs.cypress.io/guides/overview/why-cypress) for more information.

### No Interactivity use case (e.g. CI)

```BASH
cd tests/
docker compose up --exit-code-from=cypress
```

This will run all tests without any further interaction necessary.

### No docker use case

If you don't want to or can't use docker at all, make sure you have a Grafana and a CheckMK instance running somewhere.
The Plugin you want to test needs to be installed in you Grafana instance.

You also need to set serval environment variables.

| Variable                    | Description                                  |
| --------------------------- | -------------------------------------------- |
| CYPRESS_baseUrl             | The URL to your Grafana instance             |
| CYPRESS_grafanaUsername     | The username used to log into Grafana        |
| CYPRESS_grafanaPassword     | the password used to log into Grafana        |
| CYPRESS_grafanaToCheckmkUrl | The url from which grafana can reach CheckMK |
| CYPRESS_cypressToCheckmkUrl | The url from which cypress can reach CheckMK |
| CYPRESS_cmkUsername         | The username of a CheckMK admin              |
| CYPRESS_cmkPassword         | The password of that CheckMK admin           |

If everything is set up, just start cypress the usual way.

```BASH
yarn run cypress open

# or if you just want to see the results
yarn run cypress run
```

Please note that the test have side effects on your Grafana and CheckMK instance,
such as creating a new automation user.

### Making sure you use the latest Grafana image
Docker (compose) reuses already downloaded images as much as it can. So in order to get the latest Grafana image
you need to remove the current image you have. The following snipped does a clean sweep.
```BASH
docker compose down --rmi all
```