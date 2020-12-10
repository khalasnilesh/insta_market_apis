FROM node:8.9.1-slim

RUN set -eux; \
	DEBIAN_FRONTEND=noninteractive; \
	apt-get -q update; \
    npm install nodemon -g; \
	apt-get -q clean; \
	rm -rf /var/lib/apt/lists/*
