#!/usr/bin/env bash

set -euo pipefail

RUNNING_IN_CI=${JOB_NAME:=""}
KUBECTL_VERSION=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)
DEX_CLIENT_DIR="tools/simple-dex-client"
DEX_CLIENT_BIN="${DEX_CLIENT_DIR}/bin/simple-dex-client"

E2E_USER_EMAIL_DOMAIN="kubermatic.io"
E2E_USERNAME_PREFIX="e2e-"
KUBERMATIC_DEX_DEV_E2E_USERNAME=""
KUBERMATIC_DEX_DEV_E2E_PASSWORD=""

if [[ -z ${JOB_NAME} ]]; then
	echo "This script should only be running in a CI environment."
	exit 0
fi

function delete::user {
	USER_TO_DELETE=$1

	if [[ -z ${USER_TO_DELETE} ]]; then
		return
	fi

	echo "Deleting user: ${USER_TO_DELETE}"
	${DEX_CLIENT_BIN} --dex-host=localhost:5557 --action=delete --email=${USER_TO_DELETE}
}

function cleanup {
	if [[ -z "${KUBERMATIC_DEX_DEV_E2E_USERNAME}" ]]; then
		return
	fi

	K8C_USER_ID=$(kubectl get users -o json | jq -r '.items[] | select(.spec.email == "'${KUBERMATIC_DEX_DEV_E2E_USERNAME}'") | .metadata.name')

	if [[ -z ${K8C_USER_ID} ]]; then
	 	echo "User with email: ${KUBERMATIC_DEX_DEV_E2E_USERNAME} not found."
	 	delete::user ${KUBERMATIC_DEX_DEV_E2E_USERNAME}
	 	return
	fi

	kubectl delete user ${K8C_USER_ID}

	delete::user ${KUBERMATIC_DEX_DEV_E2E_USERNAME}
	KUBERMATIC_DEX_DEV_E2E_USERNAME=""
}
trap cleanup EXIT ERR

apt install -y jq

echo "Downloading and installing kubectl ${KUBECTL_VERSION}"
curl --silent -LO https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl > /dev/null
chmod +x ./kubectl
mv ./kubectl /usr/bin/kubectl

echo "Exposing dex gRPC API on localhost:5557..."
kubectl --kubeconfig=/etc/kubeconfig/kubeconfig -n oauth port-forward service/dex 5557 5557 > /dev/null 2> /dev/null &
sleep 5

echo "Building the Dex client"
make -C ${DEX_CLIENT_DIR} > /dev/null

export KUBERMATIC_DEX_DEV_E2E_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 12 | head -n 1)
export KUBERMATIC_DEX_DEV_E2E_USERNAME=$(${DEX_CLIENT_BIN} --dex-host=localhost:5557 --action=create --randomize --prefix=${E2E_USERNAME_PREFIX} --email-domain=${E2E_USER_EMAIL_DOMAIN} --password=${KUBERMATIC_DEX_DEV_E2E_PASSWORD})
echo "Created user: ${KUBERMATIC_DEX_DEV_E2E_USERNAME}"

npm run e2e
