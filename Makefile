SHELL=/bin/bash
KUBERMATIC_EDITION?=ee
REPO=quay.io/kubermatic/dashboard$(shell [[ "$(KUBERMATIC_EDITION)" != "ce" ]] && echo "\-${KUBERMATIC_EDITION}" )
IMAGE_TAG=$(shell echo $$(git rev-parse HEAD)|tr -d '\n')
VERSION=$(shell git describe --tags --match "v[0-9]*")
CC=npm
export GOOS?=linux

# TODO: Old images config. Remove once deprecation period ends.
REPO_OLD=quay.io/kubermatic/ui-v2

all: install run

install:
	@$(CC) ci --unsafe-perm

check: install
	@$(CC) run check

verify-go:
	go mod verify

run:
	@$(CC) start

test-full: test run-e2e

test:
	@$(CC) test

test-headless: install
	@$(CC) run test:ci
	./hack/upload-coverage.sh

run-e2e-ci: install
	./hack/e2e/ci-e2e.sh

dist: install
	@KUBERMATIC_EDITION=${KUBERMATIC_EDITION} $(CC) run build

build:
	CGO_ENABLED=0 go build -a -ldflags '-w -extldflags -static -X 'main.Edition=${KUBERMATIC_EDITION}' -X 'main.Version=${VERSION}'' -o dashboard .

docker-build: build dist
	docker build -t $(REPO):$(IMAGE_TAG) .

docker-push: docker-build
	docker push $(REPO):$(IMAGE_TAG)
	# TODO: Pushing old images. Remove once deprecation period ends.
	docker tag $(REPO):$(IMAGE_TAG) $(REPO_OLD):$(IMAGE_TAG)
	docker push $(REPO_OLD):$(IMAGE_TAG)
	for TAG in $(ADDITIONAL_TAGS) ; do \
		docker tag $(REPO):$(IMAGE_TAG) $(REPO):$$TAG ; \
		docker push $(REPO):$$TAG ; \
		docker tag $(REPO_OLD):$(IMAGE_TAG) $(REPO_OLD):$$TAG ; \
		docker push $(REPO_OLD):$$TAG ; \
	done

deploy:
	kubectl -n kubermatic patch kubermaticconfiguration kubermatic --patch '{"spec":{"ui":{"dockerTag":"$(IMAGE_TAG)"}}}' --type=merge
