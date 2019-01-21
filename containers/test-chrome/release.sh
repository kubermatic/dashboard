#!/usr/bin/env bash

TAG=v0.4

set -euox pipefail

docker build --no-cache --pull -t quay.io/kubermatic/chrome-headless:${TAG} .
docker push quay.io/kubermatic/chrome-headless:${TAG}
