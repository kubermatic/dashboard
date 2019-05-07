FROM docker:18.06.3-ce-dind

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY utils/ opt/e2e/
RUN ln -s /opt/e2e/deploy.sh /usr/local/bin && \
    ln -s /opt/e2e/expose.sh /usr/local/bin

RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    nano \
    curl \
    wget \
    jq \
    bash \
    nodejs \
    npm \
    go \
    make \
    git \
    chromium-chromedriver \
    python \
    gcc \
    g++ \
    chromium \
    py-pip && \
    pip install selenium && \
    rm -rf /var/cache/*

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROME_DRIVER="/usr/bin/chromedriver"

RUN curl -L https://storage.googleapis.com/kubernetes-helm/helm-v2.12.1-linux-amd64.tar.gz|tar -xvz && \
    chmod +x linux-amd64/helm && \
    mv linux-amd64/helm /usr/local/bin && \
    curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin

RUN wget https://github.com/kubernetes-sigs/kind/releases/download/0.2.1/kind-linux-amd64 && \
    chmod +x kind-linux-amd64 && \
    mv kind-linux-amd64 /usr/local/bin/kind

RUN wget "https://github.com/mikefarah/yq/releases/download/2.2.1/yq_linux_amd64" && \
    chmod +x yq_linux_amd64 && \
    mv yq_linux_amd64 /usr/local/bin/yq

CMD /start.sh
