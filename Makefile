SHELL=/bin/bash
KUBERMATIC_EDITION?=ee
REPO=quay.io/kubermatic/dashboard$(shell [[ "$(KUBERMATIC_EDITION)" != "ce" ]] && echo "\-${KUBERMATIC_EDITION}" )
IMAGE_TAG=$(shell echo $$(git rev-parse HEAD)|tr -d '\n')
HUMAN_VERSION=$(shell git tag --points-at HEAD)
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
ifeq (${HUMAN_VERSION},)
	CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)
	TARGET_BRANCH=$(or ${PULL_BASE_REF},${PULL_BASE_REF},${CURRENT_BRANCH})

	ifeq (${TARGET_BRANCH},master)
	HUMAN_VERSION=v2.16.0-dev-g$(shell git rev-parse --short HEAD)
	else
	HUMAN_VERSION=$(shell git describe --tags --match "v[0-9]*")
	endif
endif

# TODO: Old images config. Remove once deprecation period ends.
REPO_OLD=quay.io/kubermatic/ui-v2

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
	./hack/e2e/ci-e2e.sh

dist: install
	@KUBERMATIC_EDITION=${KUBERMATIC_EDITION} $(CC) run build

build:
	CGO_ENABLED=0 go build -a -ldflags '-w -extldflags -static -X 'main.Edition=${KUBERMATIC_EDITION}' -X 'main.Version=${HUMAN_VERSION}'' -o dashboard .

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
