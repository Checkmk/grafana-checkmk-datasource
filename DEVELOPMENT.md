# Development Guide

This document contains information on how to build and release the plugin. If
you are looking to use the plugin please head over to [README.md](README.md).

## Building the plugin

1. Install dependencies

```BASH
npm ci
```

2. Build plugin in development mode or run in watch mode

```BASH
npm run dev
```

3. Build plugin in production mode

```BASH
npm run build
```

## Maintenance

Code formatting

```BASH
npm run pretty
```

Update dependencies

https://grafana.com/developers/plugin-tools/migration-guides/update-create-plugin-versions

```BASH
npx @grafana/create-plugin@latest update
npm install
npx npm-check-updates -i --format group
npm run pretty:fix
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
Make sure to have an up to date `dist/` folder using `npm run build`.

### No Interactivity use case (e.g. CI)

```BASH
cd tests/
docker compose up --exit-code-from=playwright
```

This will run all tests without any further interaction necessary.


### Local development use case

Please, note that you need to set serval environment variables as described for [No docker use case](#No-docker-use-case)

```BASH
cd tests/
docker compose up -d checkmk grafana
cd ..
npm run e2e
```

You can run the tests on the console by runing 

```BASH
npm run e2e

# Or you can run it in debug mode
npm run e2e:debug
```

Or you can launch a nice interactive GUI to run and debug your E2E tests
by running 

```BASH
npm run e2e:gui
```

See the official [docs](https://playwright.dev/docs/intro) for more information.

### No docker use case

If you don't want to or can't use docker at all, make sure you have a Grafana and a CheckMK instance running somewhere.
The Plugin you want to test needs to be installed in you Grafana instance.

First you need to install the Playwright dependencies:
```BASH
npx playwright install --with-deps
```

You also need to set serval environment variables. You can export them or define them in a .env file

| Variable                    | Description                                     | Example                      |
| --------------------------- | ----------------------------------------------- | ---------------------------- |
| CMK_SITE                    | Checkmk site name                               | cmk                          |
| CMK_ADMIN                   | Administrator user name for Checkmk             | cmkadmin                     |
| CMK_AUTOMATION              | Automation user name for Checkmk                | automation                   |
| CMK_PASSWORD                | Password CMK_ADMIN and CMK_AUTOMATION           | my_secret                    |
| PLAYWRIGHT_TO_CHECKMK_URL   | URL for connecting Playwright to Checkmk        | http://127.0.0.1:12345/cmk/  |
| PLAYWRIGHT_TO_GRAFANA_URL   | URL for connecting Playwright to Grafana        | http://127.0.0.1:3003/       |
| GRAFANA_USER                | User name for connecting to Grafana's Rest API  | grafana_user                 |
| GRAFANA_PASSWORD            | Password for GRAFANA_USERNAME                   | my_other_secret              |
| GRAFANA_TO_CHECKMK_URL      | URL for connecting Grafana to Checkmk           | http://checkmk:5000/cmk/     |
| GRAFANA_TO_CHECKMK_USER     | Checkmk user name to access the Rest API        | automation                   |
| GRAFANA_TO_CHECKMK_PASSWORD | Password for GRAFANA_TO_CHECKMK_USER            | my_secret                    |


If everything is set up, just start cypress the usual way.

```BASH
# Automatic run
npm run e2e

# or if you want to run it on debug mode
npm run e2e:debug

# or if you want to run it with the fancy web interface
npm run e2e:gui
```

Please note that the test have side effects on your Grafana and CheckMK instance,
such as creating a new automation user.

### Making sure you use the latest Grafana image
Docker (compose) reuses already downloaded images as much as it can. So in order to get the latest Grafana image
you need to remove the current image you have. The following snipped does a clean sweep.
```BASH
docker compose down --rmi all
```
