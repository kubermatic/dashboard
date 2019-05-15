FROM ubuntu:16.04

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY utils/ opt/e2e/
RUN ln -s /opt/e2e/deploy.sh /usr/local/bin && \
    ln -s /opt/e2e/expose.sh /usr/local/bin

RUN apt-get update -qq && apt-get install -qqy \
    apt-transport-https \
    ca-certificates \
    curl \
    lxc \
    iptables \
    apt-utils \
    kmod \
    apt-utils \
    wget \
    jq \
    bash \
    git \
    libgtk2.0-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb && \
    rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_11.x  | bash - && \
	  apt-get -y install nodejs

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh

# Install Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
	  apt update && \
	  apt install -y ./google-chrome-stable_current_amd64.deb

# Install Helm & Kubectl
RUN curl -L https://storage.googleapis.com/kubernetes-helm/helm-v2.12.1-linux-amd64.tar.gz|tar -xvz && \
    chmod +x linux-amd64/helm && \
    mv linux-amd64/helm /usr/local/bin && \
    curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin

# Install Kind
RUN wget https://github.com/kubernetes-sigs/kind/releases/download/0.2.1/kind-linux-amd64 && \
    chmod +x kind-linux-amd64 && \
    mv kind-linux-amd64 /usr/local/bin/kind

# Install yq
RUN wget "https://github.com/mikefarah/yq/releases/download/2.2.1/yq_linux_amd64" && \
    chmod +x yq_linux_amd64 && \
    mv yq_linux_amd64 /usr/local/bin/yq

VOLUME /var/lib/docker

CMD /start.sh
