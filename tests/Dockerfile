FROM mcr.microsoft.com/playwright:v1.46.1-jammy

WORKDIR /app

COPY ./package*.json ./

RUN apt-get update && \
    apt-get install -y jq && \
    npm ci && \
    npx playwright install --with-deps

COPY . ./

ENTRYPOINT [ "npm", "run", "e2e:ci" ]
