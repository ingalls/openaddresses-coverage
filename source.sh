#!/bin/bash
# Called from map.sh - processes a single source instance

SOURCE=$1

echo "# $SOURCE"

if [[ $(jq -r -c '.coverage | .country' $SOURCE) != "us" ]]; then
    echo "ok - only us supported"
    exit;
fi

# GeoJSON tag overrides anything else
GEOJSON=$(jq -r -c '.coverage | ."geometry"' $SOURCE)
if [[ $GEOJSON != "null" ]]; then
    echo "{ \"type\": \"Feature\", \"properties\": {}, \"geometry\": $GEOJSON }" >> $(dirname $0)/map/geom.geojson
    exit
fi

# Render States
if [[ $(jq '.coverage | ."US Census" | .name' $SOURCE) == "null" ]] \
    && [[ $(jq '.coverage | ."US Census" | .state' $SOURCE) != "null" ]]
then
    echo "ok - is a state"
    GEOID=$(jq -r -c '.coverage | ."US Census" | .geoid' $SOURCE)
    if [[ $GEOID != "null" ]]; then
        echo "$GEOID,yes" >> $(dirname $0)/map/geoid.csv
        exit
    fi
    exit;
fi

# Render Counties
if [[ $(jq '.coverage | .county' $SOURCE) == "null" ]]; then
    echo "ok - not a county"

    exit;
fi

GEOID=$(jq -r -c '.coverage | ."US Census" | .geoid' $SOURCE)
if [[ $GEOID != "null" ]]; then
    echo "$GEOID,yes" >> $(dirname $0)/map/geoid.csv
    exit
fi
