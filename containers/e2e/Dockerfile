FROM docker:18.06.3-ce-dind as download

RUN apk update && \
	apk add --no-cache \
	curl && \
	rm -rf /var/cache/*

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

FROM docker:18.06.3-ce-dind

RUN apk update && \
    apk add --no-cache \
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
COPY utils/ opt/e2e/
COPY start.sh /start.sh

RUN ln -s /opt/e2e/deploy.sh /usr/local/bin && \
    ln -s /opt/e2e/expose.sh /usr/local/bin && \
	chmod +x /start.sh

CMD /start.sh
