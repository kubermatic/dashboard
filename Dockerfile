FROM node:8 as dist

WORKDIR /app

COPY package* /app/

RUN npm install

COPY angular-cli.json /app/
COPY ts*.json /app/
COPY src /app/src/

RUN npm run build -prod

FROM golang:1.10 as build

COPY *.go /usr/src/app/
COPY vendor /go/src/

WORKDIR /usr/src/app

RUN CGO_ENABLED=0 go build -ldflags '-w -extldflags '-static'' -o dashboard-v2 .

FROM alpine:3.7

LABEL maintainer="sebastian@loodse.com"

RUN apk add -U ca-certificates && rm -rf /var/cache/apk/*

COPY --from=build /usr/src/app/dashboard-v2 /
COPY --from=dist /app/dist /dist

CMD ["/dashboard-v2"]
