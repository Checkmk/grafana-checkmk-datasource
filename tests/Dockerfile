FROM mcr.microsoft.com/playwright:v1.46.1-jammy

WORKDIR /app

COPY . ./

RUN apt-get update && \
    apt-get install -y jq && \
    npm install && \
    npx playwright install --with-deps

ENTRYPOINT [ "npm", "run", "e2e:ci" ]
