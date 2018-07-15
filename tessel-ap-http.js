'use strict';
/*
    tessel-ap-http.js - Can be instantiated to create an 
    HTTP server that listens on a specified IP address,
    port, and can optionally call a client supplied
    function for managing application specific requests.

    (c) 2018 j.motyl - https://github.com/jxmot
*/
// all the necessary stuff...
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
// file extension to mime type table
const mimetyp = require('./mimetypes.js');
// Unmute/mute console output.
const _con = require('./consolelog.js');
const con = new _con();

//////////////////////////////////////////////////////////////////////////////
// HTTP Server Module
module.exports = httpsrv;
// returns the mime type for a file with
// a path
httpsrv.mime = function(pathname) {
    return mimetyp.types[path.parse(pathname).ext];
};

// returns the mime type for a specific
// file extension
httpsrv.mimetype = function(ext) {
    return mimetyp.types[ext];
};

// create the object...
function httpsrv(ipaddr, port, _docroot, userPaths) {
    // create a "document root" for this particular
    // instance of the server.
    let docroot = 'www';
    if(_docroot !== undefined) {
        docroot = _docroot;
    }

    const wwwpath = path.join(path.join(__dirname,'public'), docroot);
    const wwwcomm = path.join(__dirname,'public');

    con.log(`httpsrv : starting up http server on ${ipaddr}:${port} ${wwwpath}`);

    // Create the server, and wait for a connection....
    const serverhttp = http.createServer();

    serverhttp.on('listening', () => {
        con.trace(`httpsrv : server is listening on ${ipaddr}:${port}`);
    });

    serverhttp.on('error', (err) => {
        console.error(err);
    });

    serverhttp.listen(port, ipaddr);

    serverhttp.on('request',(req, res) => {
        let bRet = false;

        con.trace(`httpsrv : ${ipaddr} ${req.method} ${req.url}`);

        const reqpath = url.parse(req.url).pathname;

        if(userPaths !== undefined) bRet = userPaths(reqpath, req, res, httpsrv);

        if(bRet === false) {
            if(req.method == 'GET') {
                servePath(req, res, wwwpath, wwwcomm);
            } // else POST, DEL, PATCH, etc
        }
    });
};

function servePath(req, res, wwwpath, wwwcomm) {

    let pathname = path.join(wwwpath, url.parse(req.url).pathname);

    fs.exists(pathname, (exist) => {
        if(!exist) {
            // check wwwcomm + url for exist before 404
            let pubpath = path.join(wwwcomm,url.parse(req.url).pathname);
            con.log(`httpsrv.servePath() : check ${pubpath}`)
            fs.exists(pubpath, (exist) => {
                if(!exist) {
                    res.statusCode = 404;
                    con.log(`httpsrv.servePath() : File ${pathname} not found!`);
                    serveFile(path.join(wwwcomm, '404.html'), res);
                } else {
                    serveFile(pubpath, res);
                }
            });
        } else {
            if (fs.statSync(pathname).isDirectory()) {
                pathname = path.join(pathname, 'index.html');
            }
            serveFile(pathname, res);
        }
    });    
};

function serveFile(pathname, res) {
    con.log('serveFile - '+pathname);
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

