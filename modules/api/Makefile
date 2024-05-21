SHELL=/bin/bash
export KUBERMATIC_EDITION ?= ee
KUBERMATIC_VERSION?=v2.25.4
DOCKER_REPO ?= quay.io/kubermatic
REPO = $(DOCKER_REPO)/dashboard$(shell [[ "$(KUBERMATIC_EDITION)" != "ce" ]] && printf -- '-%s' ${KUBERMATIC_EDITION})
IMAGE_TAG=$(shell echo $$(git rev-parse HEAD)|tr -d '\n')
CC=npm
GOOS ?= $(shell go env GOOS)
export GOOS

# This determines the version that is printed at the footer in the
# dashboard. It does not influence the tags used for the Docker images
# for each revision.
# As we only tag revisions in the release branches, a simple `git describe`
# in the main branch yields not usable result. This is why the main
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

	ifeq (${TARGET_BRANCH},main)
	HUMAN_VERSION=${KUBERMATIC_VERSION}-dev-g$(shell git rev-parse --short HEAD)
	else
	HUMAN_VERSION=$(or $(shell git describe --tags --match "v[0-9]*"),${KUBERMATIC_VERSION}-dev-g$(shell git rev-parse --short HEAD))
	endif
endif

export CGO_ENABLED ?= 0
export GOFLAGS ?= -mod=readonly -trimpath
export GO111MODULE = on
CMD ?= $(notdir $(wildcard ./cmd/*))
GOBUILDFLAGS ?= -v
GIT_VERSION = $(shell git describe --tags --always)
TAGS ?= $(GIT_VERSION)
DOCKERTAGS = $(TAGS) latestbuild
DOCKER_BUILD_FLAG += $(foreach tag, $(DOCKERTAGS), -t $(REPO):$(tag))
KUBERMATICCOMMIT ?= $(shell git log -1 --format=%H)
KUBERMATICDOCKERTAG ?= $(KUBERMATICCOMMIT)
UIDOCKERTAG ?= NA
LDFLAGS += -extldflags '-static' \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.gitVersion=$(GIT_VERSION) \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.kubermaticDockerTag=$(KUBERMATICDOCKERTAG) \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.uiDockerTag=$(UIDOCKERTAG) \
  -X k8c.io/dashboard/v2/pkg/version/kubermatic.Edition=$(KUBERMATIC_EDITION) \
  -X k8c.io/dashboard/v2/pkg/version/kubermatic.Version=$(HUMAN_VERSION)
LDFLAGS_EXTRA ?= -w
BUILD_DEST ?= _build
GOTOOLFLAGS ?= $(GOBUILDFLAGS) -ldflags '$(LDFLAGS_EXTRA) $(LDFLAGS)' $(GOTOOLFLAGS_EXTRA)
DOCKER_BIN := $(shell which docker)

.PHONY: all
all: install run

.PHONY: build
build: $(CMD)

.PHONY: clean
clean:
	rm -rf $(BUILD_DEST)
	@echo "Cleaned $(BUILD_DEST)"

.PHONY: $(CMD)
$(CMD): %: $(BUILD_DEST)/%

$(BUILD_DEST)/%: cmd/% download-gocache
	GOOS=$(GOOS) go build -tags "$(KUBERMATIC_EDITION)" $(GOTOOLFLAGS) -o $@ ./cmd/$*

download-gocache:
	@../../hack/ci/download-gocache.sh
	@# Prevent this from getting executed multiple times
	@touch download-gocache

version:
	@echo $(HUMAN_VERSION)

# API tests
api-test: download-gocache run-api-tests build-tests

run-api-tests:
	./hack/run-api-tests.sh

lint:
	golangci-lint run \
		--verbose \
		--print-resources-usage \
		./pkg/... ./cmd/...

.PHONY: verify-go
verify-go:
	go mod verify

.PHONY: verify-imports
verify-imports:
	./hack/verify-import-order.sh

.PHONY: check-dependencies
check-dependencies:
	go mod tidy
	go mod verify
	git diff --exit-code

.PHONY: build-tests
build-tests:
	go test -tags "$(KUBERMATIC_EDITION)" -run nope ./pkg/... ./cmd/...

.PHONY: verify
verify:
	./hack/verify.sh

.PHONY: update-kkp
update-kkp:
	go get -v k8c.io/kubermatic/v2@main
	go mod tidy
