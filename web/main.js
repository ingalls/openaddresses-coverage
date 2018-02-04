/*jshint browser:true,curly: false */
/* global L */

window.onload = () => {
    window.vue = new Vue({
        el: '#app',
        data: {
            modal: {
                type: false,
                login: {
                    username: '',
                    password: ''
                }
            },
            credentials: {
                map: { key: 'pk.eyJ1IjoiaW5nYWxscyIsImEiOiJsUDF2STRrIn0.S0c3ZNH4HmseIdPXY-CTlA' },
                muckrock: false
            },
            county: false
        },
        created: function() { },
        watch: { },
        methods: {
            login: function() {
                fetch('/muckrock/token-auth/', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: this.modal.login.username,
                        password: this.modal.login.password
                    })
                }).then((response) => {
                    return response.json();
                }).then((body) => {
                    this.credentials.muckrock = body.token;

                    this.modal.login.password = '';
                });
            },
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

