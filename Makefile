SHELL=/bin/bash
KUBERMATIC_EDITION?=ee
KUBERMATIC_VERSION?=v2.21.9
REPO=quay.io/kubermatic/dashboard$(shell [[ "$(KUBERMATIC_EDITION)" != "ce" ]] && echo "\-${KUBERMATIC_EDITION}" )
IMAGE_TAG=$(shell echo $$(git rev-parse HEAD)|tr -d '\n')
CC=npm
export GOOS?=linux

# This determines the version that is printed at the footer in the
# dashboard. It does not influence the tags used for the Docker images
# for each revision.
# As we only tag revisions in the release branches, a simple `git describe`
# in the master branch yields not usable result. This is why the master
# branch is manually set to the next minor version. When using a version
# stamp like "v2.16.0-dev-gXXXX", Git only cares for the hash at the end,
# thankfully.
# We start by taking PULL_BASE_REF, which can be a tag name (for tagged
# postsubmits) or a branch name (for presubmits and postsubmits without tags).
# If it's a version, we keep it, so that re-running old Prow jobs for old
# revisions will still use the correct tag (think of having multiple tags
# on the same commit).
HUMAN_VERSION=$(shell [[ "$(PULL_BASE_REF)" =~ v[0-9]+.* ]] && echo $(PULL_BASE_REF))
ifeq (${HUMAN_VERSION},)
	CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
	TARGET_BRANCH=$(or ${PULL_BASE_REF},${CURRENT_BRANCH})

	ifeq (${TARGET_BRANCH},master)
	HUMAN_VERSION=${KUBERMATIC_VERSION}-dev-g$(shell git rev-parse --short HEAD)
	else
	HUMAN_VERSION=$(or $(shell git describe --tags --match "v[0-9]*"),${KUBERMATIC_VERSION}-dev-g$(shell git rev-parse --short HEAD))
	endif
endif

all: install run

version:
	@echo $(HUMAN_VERSION)

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
	./hack/e2e/run-tests.sh

dist: install
	@KUBERMATIC_EDITION=${KUBERMATIC_EDITION} $(CC) run build

build:
	CGO_ENABLED=0 go build -a -ldflags '-w -extldflags -static -X 'main.Edition=${KUBERMATIC_EDITION}' -X 'main.Version=${HUMAN_VERSION}'' -o dashboard .

docker-build: build dist
	docker build -t $(REPO):$(IMAGE_TAG) .

docker-push: docker-build
	docker push $(REPO):$(IMAGE_TAG)
	for TAG in $(ADDITIONAL_TAGS) ; do \
		docker tag $(REPO):$(IMAGE_TAG) $(REPO):$$TAG ; \
		docker push $(REPO):$$TAG ; \
	done

deploy:
	kubectl -n kubermatic patch kubermaticconfiguration kubermatic --patch '{"spec":{"ui":{"dockerTag":"$(IMAGE_TAG)"}}}' --type=merge
