const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const mimeType = {
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml'/*,

    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.eot': 'appliaction/vnd.ms-fontobject',
    '.ttf': 'aplication/font-sfnt'
*/
};

module.exports = (() => {

    var wwwpath = path.join(__dirname, 'www');

    httpsrv = {};

    httpsrv.init = (ipaddr, port, docroot) => {

        if(docroot !== undefined) {
            wwwpath = path.join(__dirname, docroot);
        }
        console.log(`httpsrv : starting up http server on ${ipaddr}:${port} ${wwwpath}`);

        // Create the server, and wait for a connection....
        var serverhttp = http.createServer();

        serverhttp.on('listening', () => {
            console.log(`httpsrv : server is listening on ${ipaddr}:${port}`);
        });

        serverhttp.on('error', (err) => {
            console.log(err);
        });

        serverhttp.listen(port, ipaddr);

        serverhttp.on('request',(req, res) => {
            console.log(`httpsrv : ${req.method} ${req.url}`);

            const parsedUrl = url.parse(req.url);
            let reqpath = `${parsedUrl.pathname}`;

            if(reqpath.includes('/info/') === true) {
                switch(reqpath) {
                    case '/info/ip' :
                        res.statusCode = 200;
                        //res.end(`${req.connection.remoteAddress}`);
                        let ipx = req.headers["x-forwarded-for"];
                        if(ipx) {
                            let list = ipx.split(",");
                            ipx = list[list.length-1];
                        } else ipx = req.connection.remoteAddress;
                        res.end(`${ipx}`);
                        break;

                    case '/info/stations':
                    case '/info/TBD':
                    default:
                        res.statusCode = 501;
                        res.end(`unknown ${reqpath} - ${err}`);
                        break;
                };
            } else {
                let pathname = path.join(wwwpath, reqpath);
                if(req.method == 'GET') {
                    servePath(pathname, res);
                } // else POST, DEL, PATCH, etc
            }
        });
    };

    function servePath(pathname, res) {
        fs.exists(pathname, function (exist) {
            if(!exist) {
                if(pathname.includes('favicon.ico') === true) {
                    console.log('httpsrv.servePath() : favicon.ico request, responding with 204');
                    res.status(204).send('/favicon.ico does not exist');
                    res.end();
                } else {
                    res.statusCode = 404;
                    console.log(`httpsrv.servePath() : File ${pathname} not found!`);
                    pathname = path.join(wwwpath, '404.html');
                    serveFile(pathname, res);
                }
             } else {
                if (fs.statSync(pathname).isDirectory()) {
                    pathname = path.join(wwwpath, 'index.html');
                }
                res.statusCode = 200;
                serveFile(pathname, res);
            }
        });    
    };

    function serveFile(pathname, res) {
        fs.readFile(pathname, function(err, data){
            if(err){
                res.statusCode = 500;
                res.end(`Error getting the file - ${err}.`);
            } else {
                res.setHeader('Content-type', mimeType[path.parse(pathname).ext] || 'text/plain' );
                res.end(data);
            }
        });
    };

    return httpsrv;
})();
