const express = require('express');
const httpProxy = require('http-proxy');
const bodyParser = require('body-parser');

httpProxy.prototype.onError = err => {
    console.log(err);
};

const proxy = httpProxy.createProxyServer({
    changeOrigin: true
});

const server = express();
server.set('port', 3000);
server.use(express.static(__dirname + '/web'));

server.all('*', (req, res) => {
    proxy.web(req, res, {
        target: 'https://www.muckrock.com/'
    }, err => {
        console.error(err); 
    });

});

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    extended: true
}));

// Start Server.
server.listen(server.get('port'), function() {
    console.log('Express server listening on port ' + server.get('port'));
});
