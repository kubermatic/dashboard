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

FROM --platform=$BUILDPLATFORM docker.io/alpine:3.23

ARG BUILDPLATFORM
ARG TARGETARCH

LABEL maintainer="support@kubermatic.com"

# Source: https://dl.k8s.io/release/stable-1.34.txt
ENV KUBECTL_VERSION=v1.34.3

# Source: https://github.com/helm/helm/releases
ENV HELM_VERSION=v3.18.5

# Source: https://github.com/k8sgpt-ai/k8sgpt/releases
ENV K8SGPT_VERSION=v0.4.27

# Source: https://github.com/derailed/k9s/releases
ENV K9S_VERSION=v0.50.18

# Source: https://github.com/kubernetes-sigs/krew/releases
ENV KREW_VERSION=v0.4.5

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
  curl \
  fzf-bash-plugin \
  git \
  jq \
  make \
  openssh-client \
  unzip \
  tar \
  wget \
  ncurses

# Install kubectl
RUN curl -Lo /usr/bin/kubectl https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl && \
  chmod +x /usr/bin/kubectl && \
  kubectl version --client

# Install helm
RUN curl --fail -L https://get.helm.sh/helm-${HELM_VERSION}-linux-${TARGETARCH}.tar.gz | tar -xzO linux-${TARGETARCH}/helm > /usr/local/bin/helm && \
  chmod +x /usr/local/bin/helm && \
  helm version --short

# Install k9s
RUN curl -LO https://github.com/derailed/k9s/releases/download/${K9S_VERSION}/k9s_Linux_${TARGETARCH}.tar.gz && \
  tar -xzf k9s_Linux_${TARGETARCH}.tar.gz && \
  mv k9s /usr/local/bin/k9s && \
  chmod +x /usr/local/bin/k9s && \
  k9s version

# Install krew
RUN curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/download/${KREW_VERSION}/krew-linux_${TARGETARCH}.tar.gz" && \
  tar -xzf krew-linux_${TARGETARCH}.tar.gz && \
  ./krew-linux_${TARGETARCH} install krew && \
  echo "export PATH=${KREW_ROOT:-$HOME/.krew}/bin:$PATH" >> /root/.bashrc

ENV PATH="/root/.krew/bin:$PATH"

# Krew plugins
RUN PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH" && \
  kubectl krew update && \
  kubectl krew install oidc-login && \
  kubectl krew install ctx && \
  kubectl krew install ns

RUN mkdir -p /home/webshell/.local/state && \
    chown -R webshell:webshell /home/webshell/.local

USER ${USER}

RUN mkdir ${USER_HOME}/bin/

RUN wget https://raw.githubusercontent.com/kubermatic/fubectl/refs/heads/main/fubectl.source -O ${USER_HOME}/bin/fubectl.source

USER 0

RUN if [ "$TARGETARCH" = "amd64" ]; then \
        APK_ARCH="x86_64"; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
        APK_ARCH="arm64"; \
    fi && \
	curl -LO https://github.com/k8sgpt-ai/k8sgpt/releases/download/${K8SGPT_VERSION}/k8sgpt_Linux_${APK_ARCH}.tar.gz && \
    tar -xf k8sgpt_Linux_${APK_ARCH}.tar.gz && \
    mv k8sgpt /usr/bin/k8sgpt && \
    chmod +x /usr/bin/k8sgpt && \
    rm k8sgpt_Linux_${APK_ARCH}.tar.gz

USER ${USER}
COPY .bashrc /tmp/
RUN cat /tmp/.bashrc >> $USER_HOME/.bashrc
USER 0
RUN cp $USER_HOME/.bashrc /root/.bashrc

USER ${USER}
