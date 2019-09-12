FROM docker:18.06.3-ce-dind as download

ENV HELM_VERSION="2.12.1"
ENV VAULT_VERSION="1.1.3"
ENV KIND_VERSION="0.2.1"
ENV YQ_VERSION="2.2.1"

RUN apk update && \
	apk add --no-cache \
	curl && \
	rm -rf /var/cache/*

RUN curl -L https://storage.googleapis.com/kubernetes-helm/helm-v${HELM_VERSION}-linux-amd64.tar.gz|tar -xvz && \
	curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
	curl -LO https://github.com/kubernetes-sigs/kind/releases/download/${KIND_VERSION}/kind-linux-amd64 && \
	curl -LO https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 && \
        curl -LO https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip|unzip vault_*.zip && \
    chmod +x linux-amd64/helm && \
    chmod +x kubectl && \
    chmod +x kind-linux-amd64 && \
    chmod +x yq_linux_amd64 && \
    chmod +x vault && \
    mv linux-amd64/helm /usr/local/bin && \
    mv kubectl /usr/local/bin && \
    mv kind-linux-amd64 /usr/local/bin/kind && \
    mv yq_linux_amd64 /usr/local/bin/yq && \
    mv vault /usr/local/bin

FROM docker:18.06.3-ce-dind

RUN apk update && \
    apk add --no-cache \
    curl \
    jq \
    bash \
    go \
    make \
    git \
    python \
    gcc \
    g++ && \
    rm -rf /var/cache/*

COPY --from=download /usr/local/bin/helm /usr/local/bin/helm
COPY --from=download /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=download /usr/local/bin/yq /usr/local/bin/yq
COPY --from=download /usr/local/bin/kind /usr/local/bin/kind
COPY --from=download /usr/local/bin/vault /usr/local/bin/vault
COPY utils/ opt/e2e/
COPY start.sh /start.sh
COPY kindest.tar /kindest.tar

RUN ln -s /opt/e2e/deploy.sh /usr/local/bin && \
    ln -s /opt/e2e/expose.sh /usr/local/bin && \
	chmod +x /start.sh

CMD /start.sh
