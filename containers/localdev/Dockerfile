FROM ubuntu:18.04

RUN apt-get update -y
RUN apt-get install -y bash vim wget xz-utils make python
RUN apt-get build-dep -y nodejs

# just get a recent nodejs with npm included:
#RUN wget -O /opt/n.tar.xz https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
RUN wget -O /opt/n.tar.xz https://nodejs.org/dist/v10.4.1/node-v10.4.1-linux-x64.tar.xz

# install node
RUN tar x -C /opt -f /opt/n.tar.xz
RUN for x in /opt/node*/bin/*; do ln -sfn $x /usr/local/bin ; done

# polish environment
RUN useradd -c 'Node User' -m -d /home/node -s /bin/bash node
USER node
ENV HOME /home/node
WORKDIR /home/node
