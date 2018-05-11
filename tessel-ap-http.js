//'use strict';

// Node modules - 
var http = require('http');
var fs = require('fs');
var url = require('url');
/* ************************************************************************ */
// Events
const EventEmitter = require('events');

module.exports = (function() {

    httpsrv = {};

    httpsrv.init = function(ipaddr) {
        console.log('starting up http server on '+ipaddr);

        // Create the server, and wait for a connection....
        var serverhttp = http.createServer();

        serverhttp.on('listening', () => {
            console.log('server is listening');
        });

        serverhttp.on('error', (err) => {
            console.log(err);
        });

        serverhttp.listen(80, ipaddr);

        serverhttp.on('request',(req, res) => {
            console.log('method = ' + req.method);
            if(req.method == 'GET') {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('<h1>Yo</h1>');
                res.end();
            }
        });
    };

    return httpsrv;
})();
