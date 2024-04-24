SHELL = /bin/bash -eu -o pipefail
CC = npm
export KUBERMATIC_EDITION ?= ee
export CGO_ENABLED ?= 0
export GOFLAGS ?= -mod=readonly -trimpath
export GO111MODULE = on
CMD ?= $(notdir $(wildcard ./cmd/*))
GIT_VERSION = $(shell git describe --tags --always)
UI_VERSION = $(shell jq -r '.version' package.json)
LDFLAGS += -extldflags '-static' \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.gitVersion=$(GIT_VERSION) \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.kubermaticDockerTag=NA \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.uiDockerTag=NA \
  -X cmd/dashboard/main.Edition=${KUBERMATIC_EDITION} \
  -X cmd/dashboard/main.Version=${UI_VERSION}
GOBUILDFLAGS ?= -v
LDFLAGS_EXTRA = -w
BUILD_DEST ?= _build
GOTOOLFLAGS ?= $(GOBUILDFLAGS) -ldflags '$(LDFLAGS_EXTRA) $(LDFLAGS)' $(GOTOOLFLAGS_EXTRA)

.PHONY: all
all: install run

.PHONY: build
build: $(CMD)

.PHONY: $(CMD)
$(CMD): %: $(BUILD_DEST)/%

$(BUILD_DEST)/%: cmd/% download-gocache
	go build -a -tags "$(KUBERMATIC_EDITION)" $(GOTOOLFLAGS) -o $@ ./cmd/$*

download-gocache:
	@../../hack/ci/download-gocache.sh
	@# Prevent this from getting executed multiple times
	@touch download-gocache

install:
	@$(CC) ci

check: install
	@$(CC) run check

run:
	@$(CC) start

dist: install
	@KUBERMATIC_EDITION=${KUBERMATIC_EDITION} $(CC) run build

# Dashboard tests
test-full: test run-e2e-ci

test:
	@$(CC) test

test-headless: install
	@$(CC) run test:ci
	./hack/upload-coverage.sh

lint:
	golangci-lint run \
		--verbose \
		--print-resources-usage \
		./cmd/...

.PHONY: verify-go
verify-go:
	go mod verify

.PHONY: check-dependencies
check-dependencies:
	go mod tidy
	go mod verify
	git diff --exit-code

.PHONY: run-e2e-ci
run-e2e-ci: install
	./hack/e2e/run-tests.sh
