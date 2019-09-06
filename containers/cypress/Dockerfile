FROM ubuntu:16.04 AS download

RUN apt-get update -qq && apt-get install -yqq curl

RUN curl -L https://storage.googleapis.com/kubernetes-helm/helm-v2.12.1-linux-amd64.tar.gz|tar -xvz && \
	curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
	curl -LO https://github.com/kubernetes-sigs/kind/releases/download/0.2.1/kind-linux-amd64 && \
	curl -LO "https://github.com/mikefarah/yq/releases/download/2.2.1/yq_linux_amd64" && \
	chmod +x linux-amd64/helm && \
	chmod +x kubectl && \
	chmod +x kind-linux-amd64 && \
	chmod +x yq_linux_amd64 && \
	mv linux-amd64/helm /usr/local/bin && \
	mv kubectl /usr/local/bin && \
	mv kind-linux-amd64 /usr/local/bin/kind && \
	mv yq_linux_amd64 /usr/local/bin/yq

FROM cypress/browsers:node11.13.0-chrome73

RUN apt-get update -qq && apt-get install -y \
    bash \
    git && \
    rm -rf /var/lib/apt/lists/*

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh

COPY --from=download /usr/local/bin/helm /usr/local/bin/helm
COPY --from=download /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=download /usr/local/bin/yq /usr/local/bin/yq
COPY --from=download /usr/local/bin/kind /usr/local/bin/kind
COPY start.sh /start.sh
COPY utils/ opt/e2e/
COPY kindest.tar /kindest.tar

RUN ln -s /opt/e2e/deploy.sh /usr/local/bin && \
    ln -s /opt/e2e/expose.sh /usr/local/bin && \
    chmod +x /start.sh

VOLUME /var/lib/docker

CMD /start.sh
