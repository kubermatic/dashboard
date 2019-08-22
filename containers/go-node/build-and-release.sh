#!/usr/bin/env bash

set -e

IMG_REPO="quay.io/kubermatic"
IMG_NAME="go-node"
IMG_VERSION="1.12.9-11"

docker build -t ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION} .
docker push ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION}
