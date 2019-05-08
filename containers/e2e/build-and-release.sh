#!/usr/bin/env bash

set -e

IMG_REPO="quay.io/kubermatic"
IMG_NAME="e2e-kind"
IMG_VERSION="v1.0.6"

docker build -t ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION} .
docker push ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION}
