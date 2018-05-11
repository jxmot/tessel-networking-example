var http = require('http');
var fs = require('fs');
var url = require('url');

module.exports = (() => {

    httpsrv = {};

    httpsrv.init = (ipaddr, port) => {

        console.log('starting up http server on '+ipaddr);

        // Create the server, and wait for a connection....
        var serverhttp = http.createServer();

        serverhttp.on('listening', () => {
            console.log('server is listening');
        });

        serverhttp.on('error', (err) => {
            console.log(err);
        });

        serverhttp.listen(port, ipaddr);

        serverhttp.on('request',(req, res) => {
            console.log(`${req.method} ${req.url}`);
            if(req.method == 'GET') {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('<h1>Yo</h1>');
                res.end();
            }
        });
    };
    return httpsrv;
})();
