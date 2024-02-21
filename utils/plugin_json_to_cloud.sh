jq ".info.description = \"Checkmk data source for Checkmk Cloud or Checkmk MSP 2.2.0 or higher\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq ".name = \"Checkmk data source for Checkmk Cloud & MSP\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq '.id = "checkmk-cloud-datasource"' ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json
