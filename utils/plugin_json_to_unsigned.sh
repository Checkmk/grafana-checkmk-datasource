jq ".info.description = \"Checkmk data source\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq ".name = \"Checkmk\"" ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json

jq '.id = "tribe-29-checkmk-datasource"' ./src/plugin.json > ./src/plugin.new.json
mv ./src/plugin.new.json ./src/plugin.json
