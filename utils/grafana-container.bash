set -ex
docker rm -f grafana || true
docker run -p 3000:3000 \
        -e GF_ANALYTICS_REPORTING_ENABLED=false \
        -e GF_ANALYTICS_CHECK_FOR_UPDATES=false \
        -e GF_SECURITY_ADMIN_USER=admin \
        -e GF_SECURITY_ADMIN_PASSWORD=password \
        -e GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=tribe-29-checkmk-datasource \
        -v -v "$(pwd)"/data:/var/lib/grafana \
        --name=grafana \
        --network host \
        grafana/grafana-oss:latest
