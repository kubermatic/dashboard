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

FROM quay.io/kubermatic/build:go-1.17-node-14-kind-0.11-1 AS kkpbuild

FROM cypress/browsers:node14.17.0-chrome88-ff89
LABEL maintainer="support@kubermatic.com"

ENV GO_VERSION="1.17.1"

# make sure to keep these in-sync with that the kkpbuild base image uses;
# sadly it's not possible to copy env vars in multi-stage builds
ENV KIND_VERSION="v0.11.1"
ENV KIND_NODE_VERSION="v1.21.1"

COPY --from=kkpbuild /kindest.tar /kindest.tar
COPY --from=kkpbuild /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=kkpbuild /usr/local/bin/yq /usr/local/bin/yq
COPY --from=kkpbuild /usr/local/bin/jq /usr/local/bin/jq
COPY --from=kkpbuild /usr/local/bin/kind /usr/local/bin/kind
COPY --from=kkpbuild /usr/local/bin/vault /usr/local/bin/vault
COPY --from=kkpbuild /usr/local/bin/mc /usr/local/bin/mc
COPY --from=kkpbuild /usr/local/bin/start-docker.sh /usr/local/bin/start-docker.sh
COPY --from=kkpbuild /root/.bashrc /root/.bashrc

RUN apt-get update -qq && \
    apt-get install -y \
      curl \
      bash \
      bash-completion \
      gettext \
      git && \
    rm -rf /var/lib/apt/lists/* && \
    curl --fail -L https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz | tar -C /usr/local -xz && \
    ln -s /usr/local/bin/helm2 /usr/local/bin/helm

ENV PATH /usr/local/go/bin:$PATH

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh
