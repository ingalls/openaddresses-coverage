set -e -o pipefail

if [ -d /tmp/openaddresses ]; then
    git -C /tmp/openaddresses/ pull
else
    git clone https://github.com/openaddresses/openaddresses.git /tmp/openaddresses
fi

echo "GEOID,DONE" > $(dirname $0)/map/geoid.csv

for SOURCE in $(find /tmp/openaddresses/sources/* -name "*.json"); do
    echo "# $SOURCE"
   
    if [[ $(jq -r -c '.coverage | .country' $SOURCE) != "us" ]]; then
        echo "ok - only us supported"
        continue;
    fi

    # Render States
    if [[ $(jq '.coverage | ."US Census" | .name' $SOURCE) == "null" ]] \
        && [[ $(jq '.coverage | ."US Census" | .state' $SOURCE) != "null" ]]
    then    
        echo "ok - is a state"
        GEOID=$(jq -r -c '.coverage | ."US Census" | .geoid' $SOURCE)
        echo "$GEOID,yes" >> $(dirname $0)/map/geoid.csv
        continue
    fi

    # Render Counties
    if [[ $(jq '.coverage | .county' $SOURCE) == "null" ]]; then 
        echo "ok - not a county, skipping"
        continue;
    fi
    GEOID=$(jq -r -c '.coverage | ."US Census" | .geoid' $SOURCE)

    if [[ $GEOID == "null" ]]; then
        echo "not ok - missing geoid"
        continue
    fi

    echo "$GEOID,yes" >> $(dirname $0)/map/geoid.csv
done
