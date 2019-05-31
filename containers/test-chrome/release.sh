#!/usr/bin/env bash

TAG=v0.5

set -euox pipefail

docker build --no-cache --pull -t quay.io/kubermatic/chrome-headless:${TAG} .
docker push quay.io/kubermatic/chrome-headless:${TAG}
