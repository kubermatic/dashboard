FROM quay.io/kubermatic/go-docker:12.1-1806-0

RUN curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
    && curl -sL https://deb.nodesource.com/setup_11.x | bash - \
    && apt install nodejs
