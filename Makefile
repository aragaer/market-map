SHELL = /bin/sh

include $(BASE_DIR)/ENVIRONMENT
include ../RULES

USES_COMPONENTS = eve-api eve-market eve-region-search
USES_DATA = eve-maps-flat
BUILDID = $(shell date +%Y%m%d)

all:
	$(MAKE) -C $(COMPONENT_DIR) $(USES_COMPONENTS) OUT_DIR=$(RELEASE_DIR)/components
	$(MAKE) -C $(DATA_DIR) $(USES_DATA) OUT_DIR=$(RELEASE_DIR)/data
	cp -r application.ini chrome defaults $(RELEASE_DIR)
	sed -i -e 's/BuildID=.\+/BuildID=$(BUILDID)/' $(RELEASE_DIR)/application.ini
	$(MAKE) package
