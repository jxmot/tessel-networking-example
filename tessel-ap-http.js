'use strict';

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mimetyp = require('./mimetypes.js');

module.exports = httpsrv;

httpsrv.mime = function(pathname) {
    return mimetyp.types[path.parse(pathname).ext];
};

httpsrv.mimetype = function(ext) {
    return mimetyp.types[ext];
};

function httpsrv(ipaddr, port, _docroot, userPaths) {

    // create a "document root" for this particular
    // instance of the server.
    let docroot = 'www';
    if(_docroot !== undefined) {
        docroot = _docroot;
    }

    const wwwpath = path.join(path.join(__dirname,'public'), docroot);
    const wwwcomm = path.join(__dirname,'public');

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

        if(userPaths !== undefined) bRet = userPaths(reqpath, req, res, httpsrv);

        if(bRet === false) {
            if(req.method == 'GET') {
                servePath(req, res, wwwpath);
            } // else POST, DEL, PATCH, etc
        }
    });
};


function servePath(req, res, wwwpath) {

    let pathname = path.join(wwwpath, url.parse(req.url).pathname);

    fs.exists(pathname, (exist) => {
        if(!exist) {
            if(pathname.includes('favicon.ico') === true) {
                console.log('httpsrv.servePath() : favicon.ico request, responding with 204');
                res.status(204).send('/favicon.ico does not exist');
                res.end();
            } else {
                if(pathname.includes('404.css') === true) {
                    serveFile(path.join(path.join(__dirname,'public'), '/assets/css/404.css'), res);
                } else {
                    res.statusCode = 404;
                    console.log(`httpsrv.servePath() : File ${pathname} not found!`);
                    serveFile(path.join(path.join(__dirname,'public'), '404.html'), res);
                }
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
    console.log('serveFile - '+pathname);
    fs.readFile(pathname, (err, data) => {
        if(err){
            res.statusCode = 500;
            res.end(`Error getting the file - ${err}.`);
        } else {
            res.statusCode = (res.statusCode !== 404 ? 200 : res.statusCode);;
            res.setHeader('Content-type', mimetyp.types[path.parse(pathname).ext] || 'text/plain' );
            res.end(data);
        }
    });
};

