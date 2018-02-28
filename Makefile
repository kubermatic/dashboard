SHELL=/bin/bash
REPO=kubermatic/ui-v2
TAGS=dev
BUILD_FLAG += $(foreach tag, $(TAGS), -t $(REPO):$(tag))
CC=npm

all: install run

install:
	@$(CC) install

lint:
	@$(CC) run lint

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
	CGO_ENABLED=0 go build -ldflags '-w -extldflags '-static'' -o dashboard-v2 .

docker-build:
	docker build $(BUILD_FLAG) .

docker-push:
	for TAG in $(TAGS) ; do \
		docker push $(REPO):$$TAG ; \
	done
