#!/bin/bash

set -eo pipefail

## Update FOIA

echo "ok - UPDATING FOIA"

echo "GEOID,STATUS,SITE" > $(dirname $0)/map/foia.csv

    set -x

tail +2 $(dirname $0)/map/muckrock.csv | csvcut -d, -q'"' -c3,4,6 | while read -r line; do
    STATUS=$(echo $line | csvcut -d, -q'"' -c1)
    SITE=$(echo $line | csvcut -d, -q'"' -c2)
    JID=$(echo $line | csvcut -d, -q'"' -c3)

    if [[ -n $(grep "${JID}=" $(dirname $0)/map/muckrock_cache) ]]; then
        FIPS=$(grep "${JID}=" $(dirname $0)/map/muckrock_cache | sed 's/.*=//')
    else
        RES=$(curl --silent "https://www.muckrock.com/api_v1/jurisdiction/${JID}.json")

        if [[ $(echo $RES | jq -rc '.level') != 'l' ]]; then continue; fi

        STATE=$(echo $RES | jq -rc '.full_name' | grep -Po '[A-Z]{2}$')
        COUNTY=$(echo $RES | jq -rc '.name')

        # Probably a city - skip these
        if [[ -z $(echo $COUNTY | grep -Po "(County|Borough|Parish)") ]]; then continue; fi

        FIPS=$(grep "$COUNTY,$STATE" $(dirname $0)/map/fips_lookup.csv | cut -d, -f1)

        echo "${JID}=${FIPS}" >> $(dirname $0)/map/muckrock_cache
    fi

    echo "$FIPS,$STATUS,$SITE" >> $(dirname $0)/map/foia.csv
done

## Update map
echo "ok - UPDATING MAP"

if [ -d /tmp/openaddresses ]; then
    git -C /tmp/openaddresses/ pull
else
    git clone https://github.com/openaddresses/openaddresses.git /tmp/openaddresses
fi

echo "" > $(dirname $0)/map/geoid.csv
echo "" > $(dirname $0)/map/cageoid.csv
echo '{ "type": "FeatureCollection", "features": [' > $(dirname $0)/map/geom.geojson

parallel ./map/source.sh {} ::: $(find /tmp/openaddresses/sources/us/* -name "*.json")
parallel ./map/source.sh {} ::: $(find /tmp/openaddresses/sources/ca/* -name "*.json")

sed -i 's/}$/},/' $(dirname $0)/map/geom.geojson
sed -i '$ s/.$//' $(dirname $0)/map/geom.geojson
echo "]}" >> $(dirname $0)/map/geom.geojson

sort $(dirname $0)/map/geoid.csv -o $(dirname $0)/map/geoid.csv
sort $(dirname $0)/map/cageoid.csv -o $(dirname $0)/map/cageoid.csv

cat $(dirname $0)/map/header $(dirname $0)/map/geoid.csv > /tmp/geoid.csv
mv /tmp/geoid.csv $(dirname $0)/map/geoid.csv

cat $(dirname $0)/map/header $(dirname $0)/map/cageoid.csv > /tmp/cageoid.csv
mv /tmp/cageoid.csv $(dirname $0)/map/cageoid.csv

