#!/bin/bash
# Called from map.sh - processes a single source instance

SOURCE=$1

echo "# $SOURCE"

COUNTRY=$(jq -r -c '.coverage | .country' $SOURCE)
if [[ $COUNTRY != "us" || $COUNTRY != "ca" ||  ]]; then
    echo "ok - only us supported"
    exit;
fi

# GeoJSON tag overrides anything else
GEOJSON=$(jq -r -c '.coverage | ."geometry"' $SOURCE)
if [[ $GEOJSON != "null" ]]; then
    echo "{ \"type\": \"Feature\", \"properties\": {}, \"geometry\": $GEOJSON }" >> $(dirname $0)/map/geom.geojson
    exit
fi

if [[ $COUNTRY == "us" ]]; then
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
elif [[ $COUNTRY == "ca" ]]; then
    echo "CANADA"
fi
