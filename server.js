const express = require('express');
const httpProxy = require('http-proxy');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

httpProxy.prototype.onError = err => {
    console.log(err);
};

const proxy = httpProxy.createProxyServer({
    changeOrigin: true
});

const server = express();
server.set('port', 3000);
server.use(express.static(__dirname + '/web'));

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    extended: true
}));

server.all('*', (req, res) => {
    if (req.method === 'POST' && req.url === '/save_place') {
        try {
            if (!req.body.id) throw new Error('body.id required');

            try {
                fs.accessSync(path.resolve(__dirname, `./web/local_places/${req.body.id}.json`))
            } catch (err) {
                console.error(`ok - cached save: ${req.body.id}`);
                fs.writeFileSync(path.resolve(__dirname, `./web/local_places/${req.body.id}.json`), JSON.stringify(req.body, null, 4));
            }
        } catch(err) {
            console.error(err);
        }

        return res.send('true');
    }

    if (req.method === 'GET' && req.url.match(/jurisdiction\/[0-9]+/)) {
        let place_id = req.url.match(/jurisdiction\/([0-9]+)/)[1];

        try {
            fs.accessSync(path.resolve(__dirname, `./web/local_places/${place_id}.json`))

            console.error(`ok - cached serve: ${place_id}`);
            return res.send(require(`./web/local_places/${place_id}.json`))
        } catch (err) {
            if (!String(err).match(/ENOENT/)) console.error(err);
        }
    }

    proxy.web(req, res, {
        target: 'https://www.muckrock.com/'
    }, err => {
        console.error(err); 
    });
});

// Start Server.
server.listen(server.get('port'), function() {
    console.log('Express server listening on port ' + server.get('port'));
});
