GO?=go
GOBUILDFLAGS?=-v -ldflags '-w -extldflags '-static''
BUILD_DEST?=bin

default: build

build:
	$(GO) build $(GOTOOLFLAGS) -o $(BUILD_DEST)/simple-dex-client ./main.go

clean:
	rm -rf $(BUILD_DEST)

.PHONY: build $(TARGET)
