#!/usr/bin/env bash

set -euo pipefail

IMAGE_NAME=kubermatic-dashboard-localdev

echo "Building docker image..."
cd containers/localdev && docker build -t $IMAGE_NAME . && cd -

echo "Running docker container for frontend..."
docker run --rm  \
  --user=$(id -u) \
  -v $PWD:/host-pwd \
  $IMAGE_NAME \
  /bin/bash -c 'cd /host-pwd && make install && make run'
