FROM quay.io/kubermatic/go-111-node-11-docker:v0.1

LABEL maintainer="sebastian@loodse.com"

COPY . ${GOPATH}/src/github.com/kubermatic/dashboard-v2
WORKDIR ${GOPATH}/src/github.com/kubermatic/dashboard-v2

CMD ["make docker-run-custom"]
