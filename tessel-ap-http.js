const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('./mimetypes.js');

module.exports = httpsrv;

function httpsrv(ipaddr, port, _docroot, userPaths) {

    let docroot = 'www';
    if(_docroot !== undefined) {
        docroot = _docroot;
    }

    const wwwpath = path.join(__dirname, docroot);

    console.log(`httpsrv : starting up http server on ${ipaddr}:${port} ${wwwpath}`);

    // Create the server, and wait for a connection....
    const serverhttp = http.createServer();

    serverhttp.on('listening', () => {
        console.log(`httpsrv : server is listening on ${ipaddr}:${port}`);
    });

    serverhttp.on('error', (err) => {
        console.log(err);
    });

    serverhttp.listen(port, ipaddr);

    serverhttp.on('request',(req, res) => {
        let bRet = false;

        console.log(`httpsrv : ${req.method} ${req.url}`);

        const reqpath = url.parse(req.url).pathname;

        if(userPaths !== undefined) bRet = userPaths(reqpath, req, res);

        if(bRet === false) {
            //let pathname = path.join(wwwpath, reqpath);
            if(req.method == 'GET') {
                //servePath(pathname,wwwpath,res);
                servePath(req, res, wwwpath);
            } // else POST, DEL, PATCH, etc
        }
    });
};


//function servePath(pathname, wwwpath, res) {
function servePath(req, res, wwwpath) {

    let pathname = path.join(wwwpath, url.parse(req.url).pathname);

    fs.exists(pathname, (exist) => {
        if(!exist) {
            if(pathname.includes('favicon.ico') === true) {
                console.log('httpsrv.servePath() : favicon.ico request, responding with 204');
                res.status(204).send('/favicon.ico does not exist');
                res.end();
            } else {
                res.statusCode = 404;
                console.log(`httpsrv.servePath() : File ${pathname} not found!`);
                serveFile(path.join(wwwpath, '404.html'), res);
            }
         } else {
            if (fs.statSync(pathname).isDirectory()) {
                pathname = path.join(pathname, 'index.html');
            }
            serveFile(pathname, res);
        }
    });    
};

function serveFile(pathname, res) {
    fs.readFile(pathname, (err, data) => {
        if(err){
            res.statusCode = 500;
            res.end(`Error getting the file - ${err}.`);
        } else {
            res.statusCode = (res.statusCode !== 404 ? 200 : res.statusCode);;
            res.setHeader('Content-type', mime.types[path.parse(pathname).ext] || 'text/plain' );
            res.end(data);
        }
    });
};

