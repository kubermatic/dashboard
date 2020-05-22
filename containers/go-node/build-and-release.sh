#!/usr/bin/env bash

set -e

IMG_REPO="quay.io/kubermatic/go-node"
IMG_VERSION="1.12.9-12"

docker build -t ${IMG_REPO}:${IMG_VERSION} .
docker push ${IMG_REPO}:${IMG_VERSION}
