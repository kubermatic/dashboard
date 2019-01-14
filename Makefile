SHELL=/bin/bash
REPO=quay.io/kubermatic/ui-v2
TAGS=dev
BUILD_FLAG += $(foreach tag, $(TAGS), -t $(REPO):$(tag))
CC=npm

all: install run

install:
	@$(CC) ci

check: install
	@$(CC) run check

run:
	@$(CC) start

test-full: test e2e

test:
	@$(CC) run test

test-headless: install
	@$(CC) run test:headless

run-e2e: install
	@$(CC) run e2e

dist: install
	@$(CC) run build -prod

build:
	CGO_ENABLED=0 go build -ldflags '-w -extldflags '-static'' -o dashboard-v2 .

docker-build:
	docker build $(BUILD_FLAG) .

docker-push:
	for TAG in $(TAGS) ; do \
		docker push $(REPO):$$TAG ; \
	done
