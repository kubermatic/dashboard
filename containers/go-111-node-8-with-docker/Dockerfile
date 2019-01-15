FROM quay.io/kubermatic/go-111-docker:11.2-1806-0

RUN curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt install nodejs
