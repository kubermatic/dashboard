# Copyright 2023 The Kubermatic Kubernetes Platform contributors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM --platform=$BUILDPLATFORM docker.io/alpine:3.19

ARG BUILDPLATFORM
ARG TARGETARCH

LABEL maintainer="support@kubermatic.com"

# Source: https://dl.k8s.io/release/stable-1.28.txt
ENV KUBECTL_VERSION=v1.28.6

# Source: https://github.com/helm/helm/releases
ENV HELM_VERSION=v3.14.0

# Source: https://github.com/k8sgpt-ai/k8sgpt/releases
ENV K8SGPT_VERSION=v0.3.26

ENV USER=webshell
ENV GROUP=webshell
ENV UID=12345
ENV GID=23456

ARG USER_HOME=/home/${USER}
ENV USER_HOME=$USER_HOME
ENV HOME=$USER_HOME

RUN addgroup -S ${GROUP}  && adduser -S ${USER} -h ${USER_HOME} -G ${GROUP}

# ensure that we install a curl version that fixes CVE-2023-38545 and CVE-2023-38546.
RUN apk add --no-cache -U \
  bash \
  bash-completion \
  ca-certificates \
   'curl>=8.4.0-r0' \
  fzf-bash-plugin \
  git \
  jq \
  make \
  openssh-client \
  unzip \
  tar \
  wget

RUN curl -Lo /usr/bin/kubectl https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl && \
  chmod +x /usr/bin/kubectl && \
  kubectl version --client

RUN curl --fail -L https://get.helm.sh/helm-${HELM_VERSION}-linux-${TARGETARCH}.tar.gz | tar -xzO linux-${TARGETARCH}/helm > /usr/local/bin/helm && \
  chmod +x /usr/local/bin/helm && \
  helm version --short

USER ${USER}

RUN mkdir ${USER_HOME}/bin/

RUN wget https://rawgit.com/kubermatic/fubectl/master/fubectl.source -O ${USER_HOME}/bin/fubectl.source

USER 0
RUN curl -LO https://github.com/k8sgpt-ai/k8sgpt/releases/download/${K8SGPT_VERSION}/k8sgpt_${TARGETARCH}.apk

RUN apk add --allow-untrusted k8sgpt_${TARGETARCH}.apk

USER ${USER}
COPY .bashrc /tmp/
RUN cat /tmp/.bashrc >> $USER_HOME/.bashrc
USER 0
RUN cp $USER_HOME/.bashrc /root/.bashrc

USER ${USER}

