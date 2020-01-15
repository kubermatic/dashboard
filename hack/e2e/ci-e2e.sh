#!/usr/bin/env bash

set -euo pipefail

export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME="roxy@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2="roxy2@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD="password"

export CYPRESS_RECORD_KEY=7859bcb8-1d2a-4d56-b7f5-ca70b93f944c

export KUBERMATIC_SKIP_BUILDING=true
#export KUBERMATIC_VERSION=latest

apt install -y gettext bash-completion

export CACHE_VERSION="$(git -C ../kubermatic rev-parse HEAD)"
source ${GOPATH}/src/github.com/kubermatic/kubermatic/api/hack/ci/ci-setup-kubermatic-in-kind.sh


echodate "Creating UI Azure preset..."
cat <<EOF > preset-azure.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-azure
  namespace: kubermatic
spec:
  azure:
    tenantId: ${AZURE_E2E_TESTS_TENANT_ID}
    subscriptionId: ${AZURE_E2E_TESTS_SUBSCRIPTION_ID}
    clientId: ${AZURE_E2E_TESTS_CLIENT_ID}
    clientSecret: ${AZURE_E2E_TESTS_CLIENT_SECRET}
EOF
retry 2 kubectl apply -f preset-azure.yaml

echodate "Creating UI DigitalOcean preset..."
cat <<EOF > preset-digitalocean.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-digitalocean
  namespace: kubermatic
spec:
  digitalocean:
    token: ${DO_E2E_TESTS_TOKEN}
EOF
retry 2 kubectl apply -f preset-digitalocean.yaml

echodate "Creating UI GCP preset..."
cat <<EOF > preset-gcp.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-gcp
  namespace: kubermatic
spec:
  gcp:
    serviceAccount: ${GOOGLE_SERVICE_ACCOUNT}
EOF
retry 2 kubectl apply -f preset-gcp.yaml

echodate "Creating UI OpenStack preset..."
cat <<EOF > preset-openstack.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-openstack
  namespace: kubermatic
spec:
  openstack:
    username: ${OS_USERNAME}
    password: ${OS_PASSWORD}
    tenant: ${OS_TENANT_NAME}
    domain: ${OS_DOMAIN}
EOF
retry 2 kubectl apply -f preset-openstack.yaml

echodate "Applying user..."
retry 2 kubectl apply -f $(dirname $0)/fixtures/user.yaml

WAIT_ON_TIMEOUT=600000 npm run e2e:local
