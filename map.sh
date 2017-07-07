#!/bin/bash

set -eo pipefail

if [ -d /tmp/openaddresses ]; then
    git -C /tmp/openaddresses/ pull
else
    git clone https://github.com/openaddresses/openaddresses.git /tmp/openaddresses
fi

echo "GEOID,DONE" > $(dirname $0)/map/geoid.csv
echo "GEOID,DONE" > $(dirname $0)/map/cageoid.csv
echo '{ "type": "FeatureCollection", "features": [' > $(dirname $0)/map/geom.geojson

parallel ./source.sh {} ::: $(find /tmp/openaddresses/sources/us/* -name "*.json")
parallel ./source.sh {} ::: $(find /tmp/openaddresses/sources/ca/* -name "*.json")

sed -i '' 's/}$/},/' $(dirname $0)/map/geom.geojson
sed -i '' '$ s/.$//' $(dirname $0)/map/geom.geojson
echo "]}" >> $(dirname $0)/map/geom.geojson

sort $(dirname $0)/map/geoid.csv -o $(dirname $0)/map/geoid.csv
sort $(dirname $0)/map/cageoid.csv -o $(dirname $0)/map/cageoid.csv
