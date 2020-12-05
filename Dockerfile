FROM alpine:3.12
LABEL maintainer="support@kubermatic.com"

RUN apk add -U ca-certificates && rm -rf /var/cache/apk/*

COPY ./dashboard /
COPY ./dist /dist
CMD ["/dashboard"]
