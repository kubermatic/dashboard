#!/usr/bin/env bash

TAG=v0.1

set -euox pipefail

docker build --no-cache --pull -t quay.io/kubermatic/go-111-node8-docker:${TAG} .
docker push quay.io/kubermatic/go-111-node8-docker:${TAG}
