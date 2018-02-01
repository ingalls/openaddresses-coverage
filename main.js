/*jshint browser:true,curly: false */
/* global L */

window.onload = () => {
    window.vue = new Vue({
        el: '#app',
        data: {
            credentials: {
                map: { key: 'pk.eyJ1IjoiaW5nYWxscyIsImEiOiJsUDF2STRrIn0.S0c3ZNH4HmseIdPXY-CTlA' }
            },
            county: false
        },
        created: function() { },
        watch: { },
        methods: {
            county_get: function(clicked) {
                this.county = clicked.properties;
            }
        }
    });

    mapboxgl.accessToken = window.vue.credentials.map.key;
    window.vue.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/ingalls/cjd3z6pq34s9k2sqqodns09fu',
        center: [ -96, 37.8 ],
        minzoom: 3,
        maxzoom: 9,
        zoom: 3
    });

    window.vue.map.on('click', (e) => {
        let clicked = window.vue.map.queryRenderedFeatures(e.point)[0];
        if (clicked && clicked.properties.NAME) window.vue.county_get(clicked);
    });
}

