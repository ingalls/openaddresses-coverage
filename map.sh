#!/bin/bash

set -eo pipefail

if [ -d /tmp/openaddresses ]; then
    git -C /tmp/openaddresses/ pull
else
    git clone https://github.com/openaddresses/openaddresses.git /tmp/openaddresses
fi

echo "GEOID,DONE" > $(dirname $0)/map/geoid.csv

parallel ./source.sh {} ::: $(find /tmp/openaddresses/sources/us/* -name "*.json")
