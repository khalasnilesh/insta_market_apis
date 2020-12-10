FROM postgres:9.5.6

RUN set -eux; \
	DEBIAN_FRONTEND=noninterative; \
	apt-get -q update; \
	apt-get -qy autoremove --purge; \
	apt-get -qy clean; \
	rm -rf /var/lib/apt/lists/* /tmp/*
