# Copyright 2020 The Kubermatic Kubernetes Platform contributors.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM ubuntu:16.04 AS download

ENV HELM2_VERSION="v2.16.6"
ENV HELM3_VERSION="v3.1.2"
ENV VAULT_VERSION="1.4.1"
ENV KIND_VERSION="v0.6.1"
ENV YQ_VERSION="3.3.0"
ENV KUBECTL_VERSION="v1.18.2"

RUN apt update && \
    apt install -y unzip curl && \
    curl --fail -L https://get.helm.sh/helm-${HELM2_VERSION}-linux-amd64.tar.gz | tar -xzO linux-amd64/helm > helm2 && \
    curl --fail -L https://get.helm.sh/helm-${HELM3_VERSION}-linux-amd64.tar.gz | tar -xzO linux-amd64/helm > helm3 && \
    curl --fail -LO https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
    curl --fail -LO https://github.com/kubernetes-sigs/kind/releases/download/${KIND_VERSION}/kind-linux-amd64 && \
    curl --fail -LO https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 && \
    curl --fail -LO https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip && \
    unzip vault_*.zip && \
    chmod +x helm2 helm3 && \
    chmod +x kubectl && \
    chmod +x kind-linux-amd64 && \
    chmod +x yq_linux_amd64 && \
    chmod +x vault && \
    mv helm2 helm3 /usr/local/bin && \
    mv kubectl /usr/local/bin && \
    mv kind-linux-amd64 /usr/local/bin/kind && \
    mv yq_linux_amd64 /usr/local/bin/yq && \
    mv vault /usr/local/bin && \
    helm2 version --short --client && \
    helm3 version --short && \
    vault version && \
    kind version && \
    kubectl version --short --client && \
    yq --version

FROM cypress/browsers:node14.7.0-chrome84

COPY --from=download /usr/local/bin/helm2 /usr/local/bin/helm2
COPY --from=download /usr/local/bin/helm3 /usr/local/bin/helm3
COPY --from=download /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=download /usr/local/bin/yq /usr/local/bin/yq
COPY --from=download /usr/local/bin/kind /usr/local/bin/kind
COPY --from=download /usr/local/bin/vault /usr/local/bin/vault

ENV GO_VERSION=1.15.2

RUN apt-get update -qq && \
    apt-get install -y \
    curl \
    bash \
    jq \
    git && \
    rm -rf /var/lib/apt/lists/* && \
    curl --fail -L https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz|tar -C /usr/local -xvz && \
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc && \
    ln -s /usr/local/bin/helm2 /usr/local/bin/helm && \
    helm init --client-only

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh

COPY kindest.tar /kindest.tar
