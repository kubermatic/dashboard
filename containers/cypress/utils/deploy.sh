#!/usr/bin/env bash
# Requires 'jq' and 'yq' to work!

set -euo pipefail

if [ "${1:-}" == "--help" ]; then
  cat <<EOF
Usage: $(basename $0) <k8c-img-tag>

  <k8c-img-tag>       the tag of the Kubermatic image that will be deployed.

Examples:
  $(basename $0) latestbuild
EOF
  exit 0
fi

DELETE=${1:-''}

SCRIPT_PATH=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")

KUBERMATIC_DOMAIN="ci.kubermatic.io"
KUBERMATIC_PATH=${SCRIPT_PATH}/helm/kubermatic
KUBERMATIC_CRD_PATH=${KUBERMATIC_PATH}/crd

KUBECONFIG_PATH=~/.kube/config
KUBECONFIG_CLUSTER_NAME="prow-build-cluster"
KUBECONFIG_ENCODED=""

DATACENTERS_PATH=${SCRIPT_PATH}/yamls/datacenters.yaml
DATACENTERS_ENCODED=$(base64 ${DATACENTERS_PATH} | tr -d '\n')

DO_E2E_TESTS_TOKEN=${DO_E2E_TESTS_TOKEN:-""}
OS_USERNAME=${OS_USERNAME:-""}
OS_PASSWORD=${OS_PASSWORD:-""}
OS_TENANT_NAME=${OS_TENANT_NAME:-""}
OS_DOMAIN=${OS_DOMAIN:-""}
AZURE_E2E_TESTS_TENANT_ID=${AZURE_E2E_TESTS_TENANT_ID:-""}
AZURE_E2E_TESTS_SUBSCRIPTION_ID=${AZURE_E2E_TESTS_SUBSCRIPTION_ID:-""}
AZURE_E2E_TESTS_CLIENT_ID=${AZURE_E2E_TESTS_CLIENT_ID:-""}
AZURE_E2E_TESTS_CLIENT_SECRET=${AZURE_E2E_TESTS_CLIENT_SECRET:-""}

PRESETS_PATH=${SCRIPT_PATH}/yamls/presets.yaml
PRESETS_ENCODED=$(eval "echo \"$(cat ${PRESETS_PATH})\"" | base64 | tr -d '\n')

DEX_PATH=${SCRIPT_PATH}/helm/oauth

TILLER_NAMESPACE="helm"
DEX_NAMESPACE="oauth"
KUBERMATIC_NAMESPACE="kubermatic"
LOCAL_PROVISIONER_NAMESPACE="local-provisioner"

KUBERMATIC_STORAGE_CLASS_NAME="kubermatic-fast"
KUBERMATIC_IMAGE_TAG=${1:-"latest"}
KUBERMATIC_IMAGE="quay.io/kubermatic/api"

function cleanup {
	kind delete cluster --name ${KUBECONFIG_CLUSTER_NAME}

	rm -rf ${SCRIPT_PATH}/helm
	rm ${SCRIPT_PATH}/yamls/kubeconfig
}

function patch::kubeconfig {
	cp ${KUBECONFIG_PATH} ${SCRIPT_PATH}/yamls/kubeconfig
	KUBECONFIG_PATH=${SCRIPT_PATH}/yamls/kubeconfig

	yq w -i ${KUBECONFIG_PATH} clusters[0].name ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} contexts[0].name ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} contexts[0].context.cluster ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} contexts[0].context.user ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} current-context ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} users[0].name ${KUBECONFIG_CLUSTER_NAME}
	yq w -i ${KUBECONFIG_PATH} clusters[0].cluster.server https://kubernetes.default:443

	KUBECONFIG_ENCODED=$(base64 ${KUBECONFIG_PATH} | tr -d '\n')
}

function prepare::files {
	mkdir -p ${SCRIPT_PATH}/helm
	cp -r $GOPATH/src/github.com/kubermatic/kubermatic/config/oauth ${DEX_PATH}
	rm ${DEX_PATH}/templates/ingress.yaml
	cp ${SCRIPT_PATH}/patch/oauth_values.yaml ${DEX_PATH}/values.yaml
	cp ${SCRIPT_PATH}/patch/oauth_configmap.yaml ${DEX_PATH}/templates/configmap.yaml

	cp -r $GOPATH/src/github.com/kubermatic/kubermatic/config/kubermatic ${KUBERMATIC_PATH}
	rm ${KUBERMATIC_PATH}/templates/ingress.yaml
}

function start::cluster {
	kind create cluster --name ${KUBECONFIG_CLUSTER_NAME}
	cp ~/.kube/kind-config-${KUBECONFIG_CLUSTER_NAME} ~/.kube/config
	export KUBECONFIG="$(kind get kubeconfig-path --name=${KUBECONFIG_CLUSTER_NAME})"
}

function prepare::cluster {
	# Delete kind default storage class
	kubectl delete storageclass standard

	# Create Kubermatic CRDs
	kubectl apply -f ${KUBERMATIC_CRD_PATH}
}

function deploy::helm {
	echo "Deploying helm"
	kubectl create namespace ${TILLER_NAMESPACE}
	kubectl create serviceaccount --namespace ${TILLER_NAMESPACE} tiller
	kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=${TILLER_NAMESPACE}:tiller

	helm init --tiller-namespace ${TILLER_NAMESPACE}
	kubectl rollout status -w deployment/tiller-deploy --namespace=${TILLER_NAMESPACE} --timeout=1m

	kubectl patch deploy --namespace ${TILLER_NAMESPACE} tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
	kubectl rollout status -w deployment/tiller-deploy --namespace=${TILLER_NAMESPACE} --timeout=1m
}

function deploy::provisioner {
	echo "Deploying hostpath-provisioner"
	helm repo add rimusz https://charts.rimusz.net
	helm repo update
	helm install --wait --timeout 180 \
		--tiller-namespace=${TILLER_NAMESPACE} \
		--namespace ${LOCAL_PROVISIONER_NAMESPACE} \
		--set storageClass.name=${KUBERMATIC_STORAGE_CLASS_NAME} \
		--name hostpath-provisioner rimusz/hostpath-provisioner
}

function deploy::dex {
	echo "Installing dex deployment"
	helm install --wait --timeout 180 \
		--tiller-namespace=${TILLER_NAMESPACE} \
		--set-string=dex.ingress.host=http://dex.oauth:5556 \
		--values ${DEX_PATH}/values.yaml \
		--namespace ${DEX_NAMESPACE} \
		--name kubermatic-oauth-e2e ${DEX_PATH}
}

function deploy::kubermatic {
	patch::kubeconfig

	echo "Installing new kubermatic deployment"
	helm install --wait --timeout 180 \
		--tiller-namespace=${TILLER_NAMESPACE} \
		--set=kubermatic.isMaster=true \
		--set=kubermatic.imagePullSecretData=$IMAGE_PULL_SECRET_DATA \
		--set=kubermatic.auth.serviceAccountKey=$SERVICE_ACCOUNT_KEY \
		--set=kubermatic.auth.tokenIssuer=http://dex.oauth:5556 \
		--set=kubermatic.auth.clientID=kubermatic \
		--set=kubermatic.datacenters=${DATACENTERS_ENCODED} \
		--set=kubermatic.presets=${PRESETS_ENCODED} \
		--set=kubermatic.domain=${KUBERMATIC_DOMAIN} \
		--set=kubermatic.kubeconfig=${KUBECONFIG_ENCODED} \
		--set=kubermatic.deployVPA=false \
		--set=kubermatic.checks.crd.disable=true \
		--set=kubermatic.etcd.diskSize=100M \
		--set=kubermatic.ingressClass=non-existent \
		--set=kubermatic.controller.replicas=1 \
		--set=kubermatic.controller.datacenterName=${KUBECONFIG_CLUSTER_NAME} \
		--set=kubermatic.controller.image.tag=${KUBERMATIC_IMAGE_TAG} \
		--set=kubermatic.api.image.tag=${KUBERMATIC_IMAGE_TAG} \
		--set=kubermatic.api.replicas=1 \
		--set=kubermatic.masterController.image.tag=${KUBERMATIC_IMAGE_TAG} \
		--set=kubermatic.controller.featureGates="" \
		--values ${KUBERMATIC_PATH}/values.yaml \
		--namespace ${KUBERMATIC_NAMESPACE} \
		--name kubermatic-e2e ${KUBERMATIC_PATH}
}

function check::env {
	if [[ -z $IMAGE_PULL_SECRET_DATA ]]; then
		echo "Image pull secret data not set."
		exit -1
	fi

	if [[ -z $SERVICE_ACCOUNT_KEY ]]; then
		echo "Service account key not set."
		exit -1
	fi
}

# push::img loads Kubermatic image if available locally to kind cluster
function push::img {
	if [[ ! -z $(docker images -q ${KUBERMATIC_IMAGE}:${KUBERMATIC_IMAGE_TAG}) ]]; then
		echo "Loading/pushing ${KUBERMATIC_IMAGE}:${KUBERMATIC_IMAGE_TAG} image to ${KUBECONFIG_CLUSTER_NAME} cluster"
		kind load docker-image ${KUBERMATIC_IMAGE}:${KUBERMATIC_IMAGE_TAG} --name ${KUBECONFIG_CLUSTER_NAME}
	fi
}


if [[ "${DELETE}" == "--delete" ]]; then
	cleanup
else
	check::env
	prepare::files
	start::cluster
	push::img
	prepare::cluster
	deploy::helm
	deploy::provisioner
	deploy::dex
	deploy::kubermatic

	kubectl apply -f ${SCRIPT_PATH}/yamls/user.yaml
	kubectl create ns sa-secrets
fi
