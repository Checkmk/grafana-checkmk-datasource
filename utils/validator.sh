#!/bin/bash

set -xe

rm -rf dist
npm run build
cp -r dist checkmk-cloud-datasource
zip -qr /tmp/package.zip checkmk-cloud-datasource
rm -r checkmk-cloud-datasource
npx -y @grafana/plugin-validator@latest -sourceCodeUri file://$(pwd) /tmp/package.zip
