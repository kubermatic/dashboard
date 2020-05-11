FROM quay.io/kubermatic/go-node:1.12.9-12

LABEL maintainer="sebastian@loodse.com"

ENV NG_CLI_ANALYTICS=ci

COPY . ${GOPATH}/src/github.com/kubermatic/dashboard
WORKDIR ${GOPATH}/src/github.com/kubermatic/dashboard

CMD ["make", "docker-run-custom"]
