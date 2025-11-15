SHELL := /bin/bash

install:
	npm install

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

test:
	npm test

dev:
	npm run dev

migrate:
	npm run prisma:migrate

seed:
	npm run prisma:seed

docker-up:
	npm run docker:up

docker-down:
	npm run docker:down
