SHELL = /bin/bash -eu -o pipefail
export KUBERMATIC_EDITION ?= ee
DOCKER_REPO ?= quay.io/kubermatic
REPO = $(DOCKER_REPO)/dashboard$(shell [[ "$(KUBERMATIC_EDITION)" != "ce" ]] && printf -- '-%s' ${KUBERMATIC_EDITION})
GIT_HEAD = $(shell echo $$(git rev-parse HEAD) | tr -d '\n')
DOCKER_BIN := $(shell which docker)

.PHONY: spellcheck
spellcheck:
	./hack/verify-spelling.sh

docker-build: build web-dist
	$(DOCKER_BIN) build -t "$(REPO):$(GIT_HEAD)" .

build: set-version web-build api-build

.PHONY: set-version
set-version:
	./hack/set-version.sh

docker-push: docker-build
	$(DOCKER_BIN) push "$(REPO):$(GIT_HEAD)"
	for TAG in $(ADDITIONAL_TAGS) ; do \
		$(DOCKER_BIN) tag "$(REPO):$(GIT_HEAD)" "$(REPO):$$TAG" ; \
		$(DOCKER_BIN) push "$(REPO):$$TAG" ; \
	done

deploy:
	kubectl -n kubermatic patch kubermaticconfiguration kubermatic --patch '{"spec":{"ui":{"dockerTag":"$(GIT_HEAD)"}}}' --type=merge

download-gocache:
	@./hack/ci/download-gocache.sh
	@# Prevent this from getting executed multiple times
	@touch download-gocache

# API
api-lint:
	$(MAKE) -C modules/api lint

api-test:
	$(MAKE) -C modules/api api-test

api-verify:
	$(MAKE) -C modules/api verify

api-build:
	$(MAKE) -C modules/api build

api-clean:
	$(MAKE) -C modules/api clean

# Web
web-lint:
	$(MAKE) -C modules/web lint

web-run-e2e-ci:
	$(MAKE) -C modules/web run-e2e-ci

web-test-headless:
	$(MAKE) -C modules/web test-headless

web-dist:
	$(MAKE) -C modules/web dist

web-check:
	$(MAKE) -C modules/web check

web-check-dependencies:
	$(MAKE) -C modules/web check-dependencies

web-build:
	$(MAKE) -C modules/web build
