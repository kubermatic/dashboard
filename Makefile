SHELL=/bin/bash
REPO=kubermatic/ui-v2
CC=npm

all: install run

install:
	@$(CC) install

run:
	@$(CC) run serve:proxy

test-full: test e2e

test:
	@$(CC) run test

e2e:
	@$(CC) run e2e

dist:
	@$(CC) run build -prod

build: dist
	go get github.com/jteeuwen/go-bindata/...
	go get github.com/elazarl/go-bindata-assetfs/...
	go-bindata-assetfs $$(find dist -type d)
	go get .
	go build -o dashboard-v2 .

docker:
	docker build -t $(REPO) .

push: docker
	docker push $(REPO)
