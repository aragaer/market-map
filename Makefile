SHELL = /bin/sh

include $(BASE_DIR)/ENVIRONMENT

USES_COMPONENTS = eve-api eve-market eve-region-search
USES_DATA = eve-map

all:
	$(MAKE) -C $(COMPONENT_DIR) $(USES_COMPONENTS) OUT_DIR=$(RELEASE_DIR)/components 
	
clean:
	rm -r $(RELEASE_DIR)
