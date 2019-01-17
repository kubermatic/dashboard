FROM ubuntu:18.04

RUN sed 's/^# \(deb-src\)/\1/g' -i /etc/apt/sources.list && \
  apt-get update -y && \
  apt-get install -y bash vim wget xz-utils make python && \
  apt-get build-dep -y nodejs && \
  wget -O /opt/n.tar.xz https://nodejs.org/dist/v10.4.1/node-v10.4.1-linux-x64.tar.xz && \
  tar x -C /opt -f /opt/n.tar.xz && \
  for x in /opt/node*/bin/*; do ln -sfn $x /usr/local/bin ; done && \
  useradd -c 'Node User' -m -d /home/node -s /bin/bash node

USER node
ENV HOME /home/node
WORKDIR /home/node
