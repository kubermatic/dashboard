#!/usr/bin/env bash

# A list of allowed licenses for our production dependencies
ALLOWED_LICENSES="MIT;ISC;BSD-2-Clause;BSD-2-Clause-FreeBSD;BSD-3-Clause;Apache-2.0;Zlib;0BSD"

# A list of dependencies excluded from license check. Should be validated manually before excluding
# them from the check.
# UNKNOWN license:
#   - emitter-component (dependency of swagger-ui)
#   - btoa (dependency of swagger-ui)
# CC0-1.0 license:
#   - encode-3986 (dependency of swagger-ui)
# Unlicense license:
#   - zenscroll (dependency of swagger-ui)
EXCLUDED_PACKAGES="emitter-component;btoa;encode-3986;zenscroll"

LICENSE_CHECK_OUTPUT=$(npx license-compliance --production --allow ${ALLOWED_LICENSES} -e ${EXCLUDED_PACKAGES})

if [[ ${?} == 1 ]]; then
  echo "${LICENSE_CHECK_OUTPUT}"
  echo -e "\nLicense check: \e[31mFAILED\n" 1>&2
  exit 1
fi

echo -e "License check: \e[23mOK\n"
