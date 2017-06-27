SHELL=/bin/bash
CC=npm

all: install run

install:
	@$(CC) install

run:
	@$(CC) run serve:proxy

build:
	@$(CC) run build -prod

test-full: test e2e

test:
	@$(CC) run test

e2e:
	@$(CC) run e2e
