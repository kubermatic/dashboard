#!/bin/bash

CD="$(pwd)"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# User and group ID to execute commands.
LOCAL_UID=$(id -u)
LOCAL_GID=$(id -g)

# K8C_DASHBOARD_NPM_CMD will be passed into container and will be used
# by run-npm-command.sh on container. Then the shell script will run `npm`
# command with K8C_DASHBOARD_NPM_CMD.
# But if K8C_DASHBOARD_NPM_CMD is set, the command in K8C_DASHBOARD_NPM_CMD will be
# executed instead of `npm ${K8C_DASHBOARD_NPM_CMD}`.
K8C_DASHBOARD_NPM_CMD=${K8C_DASHBOARD_NPM_CMD:-$*}

# Build and run container for dashboard
K8C_DASHBOARD_CONTAINER_NAME=${K8C_DASHBOARD_CONTAINER_NAME:-"k8c-dashboard-dev"}
K8C_DASHBOARD_IMAGE_NAME=${K8C_DASHBOARD_IMAGE_NAME:-"k8c-dashboard-dev-image"}

echo "Remove existing container ${K8C_DASHBOARD_CONTAINER_NAME}"
docker rm -f ${K8C_DASHBOARD_CONTAINER_NAME}

# Always test if the image is up-to-date. If nothing has changed since last build,
# it'll just use the already-built image
echo "Start building container image for development"
docker build -t ${K8C_DASHBOARD_IMAGE_NAME} -f ${DIR}/Dockerfile ${DIR}/../../

# Run dashboard container for development and expose necessary ports automatically.
echo "Run container for development"
docker run \
  -it \
  --name=${K8C_DASHBOARD_CONTAINER_NAME} \
  --cap-add=SYS_PTRACE \
  -e LOCAL_UID="${LOCAL_UID}" \
  -e LOCAL_GID="${LOCAL_GID}" \
  -e K8C_DASHBOARD_NPM_CMD="${K8C_DASHBOARD_NPM_CMD}" \
  -p 0.0.0.0:8080:8000 \
  ${K8C_DASHBOARD_IMAGE_NAME}
