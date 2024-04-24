SHELL = /bin/bash -eu -o pipefail
export KUBERMATIC_EDITION ?= ee
export CGO_ENABLED ?= 0
export GOFLAGS ?= -mod=readonly -trimpath
export GO111MODULE = on
CMD ?= $(notdir $(wildcard ./cmd/*))
GIT_VERSION = $(shell git describe --tags --always)
UI_VERSION = $(shell jq -r '.version' ../web/package.json)
LDFLAGS += -extldflags '-static' \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.gitVersion=$(GIT_VERSION) \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.kubermaticDockerTag=NA \
  -X k8c.io/kubermatic/v2/pkg/version/kubermatic.uiDockerTag=NA \
  -X k8c.io/dashboard/v2/pkg/version/kubermatic.Edition=$(KUBERMATIC_EDITION) \
  -X k8c.io/dashboard/v2/pkg/version/kubermatic.Version=$(UI_VERSION)
GOBUILDFLAGS ?= -v
LDFLAGS_EXTRA ?= -w
BUILD_DEST ?= _build
GOTOOLFLAGS ?= $(GOBUILDFLAGS) -ldflags '$(LDFLAGS_EXTRA) $(LDFLAGS)' $(GOTOOLFLAGS_EXTRA)

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
	go build -tags "$(KUBERMATIC_EDITION)" $(GOTOOLFLAGS) -o $@ ./cmd/$*

download-gocache:
	@../../hack/ci/download-gocache.sh
	@# Prevent this from getting executed multiple times
	@touch download-gocache

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
