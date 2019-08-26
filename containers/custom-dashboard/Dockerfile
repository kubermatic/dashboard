FROM quay.io/kubermatic/go-node:1.12.9-11

LABEL maintainer="sebastian@loodse.com"

ENV NG_CLI_ANALYTICS=ci

COPY . ${GOPATH}/src/github.com/kubermatic/dashboard-v2
WORKDIR ${GOPATH}/src/github.com/kubermatic/dashboard-v2

CMD ["make", "docker-run-custom"]
