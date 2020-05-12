FROM alpine:3.7

LABEL maintainer="sebastian@loodse.com"

RUN apk add -U ca-certificates && rm -rf /var/cache/apk/*

COPY ./dashboard /
COPY ./dist /dist
CMD ["/dashboard"]
