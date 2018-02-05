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
                muckrock: {
                    username: false,
                    token: false
                }
            },
            states: [],
            counties: [],
            requests: [],
            places: { },
            place_ids: [],
            county: false
        },
        created: function() {
            if (localStorage.muckrock) {
                try {
                    this.credentials.muckrock = JSON.parse(localStorage.muckrock);
                } catch (err) {
                    delete localStorage.muckrock
                }
            }

            fetch('/counties.json').then(response => { return response.json(); }).then(body => { this.counties = body; });
            fetch('/states.json').then(response => { return response.json(); }).then(body => { this.states = body; });
        },
        watch: {
            'credentials.muckrock': function() {
                if (this.credentials.muckrock) this.requests_load();
            }
        },
        methods: {
            places_load: function(keys) {
                if (!keys) {
                    keys = Object.keys(this.places);
                } else if (!keys.length) {
                    console.error('Done Loading');
                    return;
                }

                let place_id = keys.pop();

                fetch(`/api_v1/jurisdiction/${place_id}`, {
                    method: 'GET',
                    headers: new Headers({
                        'content-type': 'application/json',
                        Authorization: `Token ${this.credentials.muckrock.token}`
                    })
                }).then((response) => {
                    return response.json();
                }).then((body) => {
                    //Format "/place/united-states-of-america/state/county or city/",
                    let matchurl = body.absolute_url.match(/united-states-of-america\/(.*?)\/(.*)/);

                    let state = matchurl[1];
                    let countycity = matchurl[2].replace('/', '');

                    let county = false;
                    let city = false;
                    if (countycity && countycity.match(/(County|Parish|Borough)/i)) {
                        county = countycity.replace(/(County|Parish|Borough)/i, '').replace(/-/, ' ').trim();
                    } else if (countycity) {
                        city = countycity;
                    }

                    this.places[place_id].state = state;
                    this.places[place_id].county = county;
                    this.places[place_id].city = city;

                    if (this.place_ids.indexOf(body.id) == -1) {
                        this.place_ids.push(body.id);
                    }

                    this.places_load(keys);
                    
                    fetch('save_place', {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: new Headers({
                            'content-type': 'application/json'
                        })
                    });
                });
            },
            requests_parse: function() {
                for (let req_it = 0; req_it < this.requests.length; req_it++) {
                    let req = this.requests[req_it];

                    if (this.places[req.jurisdiction]) {
                        this.places[req.jurisdiction].requests.push(req_it);
                    } else {
                        this.places[req.jurisdiction] = {
                            id: req.jurisdiction,
                            state: false,
                            county: false,
                            city: false,
                            requests: []
                        }
                    }
                }

                return this.places_load();
            },
            requests_load: function(url) {
                if (!url) url = `/api_v1/foia/?user=${encodeURIComponent(this.credentials.muckrock.username)}`;
                
                fetch(url, {
                    method: 'GET',
                    headers: new Headers({
                        'content-type': 'application/json',
                        Authorization: `Token ${this.credentials.muckrock.token}`
                    })
                }).then((response) => {
                    return response.json();
                }).then((body) => {
                    this.requests = this.requests.concat(body.results);

                    if (body.next) {
                        this.requests_load(body.next.replace('https://www.muckrock.com', ''));
                    } else {
                        this.requests_parse();
                    }
                });
            },
            login: function() {
                fetch('/api_v1/token-auth/', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: this.modal.login.username,
                        password: this.modal.login.password
                    }),
                    headers: new Headers({
                        'content-type': 'application/json'
                    })
                }).then((response) => {
                    return response.json();
                }).then((body) => {
                    this.credentials.muckrock = body.token;
                    localStorage.muckrock = JSON.stringify({
                        username: this.modal.login.username,
                        token: body.token
                    });
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

