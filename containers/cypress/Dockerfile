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

RUN apt-get update -qq && apt-get install -yqq curl unzip

RUN  set +x && \
  curl --fail -L https://storage.googleapis.com/kubernetes-helm/helm-v2.16.1-linux-amd64.tar.gz|tar -xvz && \
  curl --fail -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
  curl --fail -LO https://github.com/kubernetes-sigs/kind/releases/download/v0.6.1/kind-linux-amd64 && \
  curl --fail -LO https://releases.hashicorp.com/vault/1.2.3/vault_1.2.3_linux_amd64.zip && \
  unzip vault_*.zip && \
  chmod +x vault && \
  chmod +x linux-amd64/helm && \
  chmod +x kubectl && \
  chmod +x kind-linux-amd64 && \
  mv linux-amd64/helm /usr/local/bin && \
  mv kubectl /usr/local/bin && \
  mv kind-linux-amd64 /usr/local/bin/kind && \
  mv vault /usr/local/bin/vault

FROM cypress/browsers:node12.6.0-chrome77

RUN apt-get update -qq && apt-get install -y \
    bash \
    jq \
    git && \
    rm -rf /var/lib/apt/lists/* && \
    curl --fail -L https://dl.google.com/go/go1.12.12.linux-amd64.tar.gz|tar -C /usr/local -xvz && \
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh
RUN npm i -g cypress@3.6.1

COPY --from=download /usr/local/bin/helm /usr/local/bin/helm
COPY --from=download /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=download /usr/local/bin/kind /usr/local/bin/kind
COPY --from=download /usr/local/bin/vault /usr/local/bin/vault
COPY kindest.tar /kindest.tar
