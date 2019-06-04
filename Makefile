SHELL=/bin/bash
REPO=quay.io/kubermatic/ui-v2
REPO_CUSTOM=quay.io/kubermatic/ui-v2-custom
IMAGE_TAG=$(shell echo $$(git rev-parse HEAD)|tr -d '\n')
CC=npm
export GOOS?=linux

all: install run

install:
	@$(CC) ci

check: install
	@$(CC) run check

dep:
	dep ensure -v

godep-check:
	dep check

run:
	@$(CC) start

test-full: test run-e2e

test:
	@$(CC) run test

test-headless: install
	@$(CC) run test:headless
	bash <(curl -s https://codecov.io/bash)

run-e2e-ci: install
	./hack/e2e/run_ci_e2e_test.sh

dist: install
	@$(CC) run build -prod

build:
	CGO_ENABLED=0 go build -ldflags '-w -extldflags '-static'' -o dashboard-v2 .

docker-build: build dist
	docker build -t $(REPO):$(IMAGE_TAG) .

docker-build-custom:
	docker build -f containers/custom-dashboard/Dockerfile -t $(REPO_CUSTOM):$(IMAGE_TAG) .

docker-push: docker-build
	docker push $(REPO):$(IMAGE_TAG)
	for TAG in $(ADDITIONAL_TAGS) ; do \
		docker tag $(REPO):$(IMAGE_TAG) $(REPO):$$TAG ; \
		docker push $(REPO):$$TAG ; \
	done

docker-push-custom: docker-build-custom
	docker push $(REPO_CUSTOM):$(IMAGE_TAG)

docker-run-custom: build dist
	./dashboard-v2

deploy:
	kubectl -n kubermatic set image deployment/kubermatic-ui-v2 webserver=$(REPO):$(IMAGE_TAG)
