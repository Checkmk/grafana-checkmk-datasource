jq ".info.description = \"Checkmk data source for Checkmk Cloud Edition\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq ".name = \"Checkmk for Cloud Edition\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq '.id = "checkmk-cloud-datasource"' ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json
