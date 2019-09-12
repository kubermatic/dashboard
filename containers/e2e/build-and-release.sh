#!/usr/bin/env bash

set -e

IMG_REPO="quay.io/kubermatic"
IMG_NAME="e2e-kind"
IMG_VERSION="v1.0.11"

# Preloaded images
IMG_KIND="kindest/node:v1.13.4"
IMG_KIND_NAME="kindest.tar"

docker pull ${IMG_KIND}
docker save -o ${IMG_KIND_NAME} ${IMG_KIND}
docker build -t ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION} .
docker push ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION}

rm ${IMG_KIND_NAME}
