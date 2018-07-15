# Access Point HTTP Servers (*work-in-progress*)

This file describes how HTTP servers were implemented for the [jxmot/tessel-networking-example
](https://github.com/jxmot/tessel-networking-example) project. 


**Related Documents:**
* [Project README](https://github.com/jxmot/tessel-networking-example/blob/master/README.md)
* [Application Design Details](https://github.com/jxmot/tessel-networking-example/blob/master/appdesign.md)
* [Tessel 2 Firmware Modifications](https://github.com/jxmot/tessel-networking-example/blob/master/t2mods.md)

# Overview

## Features

* Multiple instances, with :
    * Shared common resource location
    * Individual document root location
    * Optional custom path handlers
* Small footprint

## Use

Here is a simple example of how the server might be used :

```javascript
const httpsrv = require('./tessel-ap-http.js');
var http = new httpsrv('192.168.1.101', 80, 'www');
```

# Details

The operation of the server is :

<p align="center">
  <img src="./mdimg/flow-6.jpg" alt="Application overview flow chart" txt="Application overview flow chart" width="35%">
</p>

## Integrating

### Resource Folder Hierarchy

```
\ ------+
        |
        +- public --+-- 404.html
                    |
                    +-- assets ---+
                    |             |
                    |             + css -- 404.css
                    |
                    |
                    +-- www ------+-- index.html, favicon.ico
                    |             |
                    |             +-- assets -+
                    |                         + img -- tessel.png 
                    |
                    |
                    +-- wwwadmin -+-- index.html, favicon.ico
                                  |
                                  +-- assets -+
                                              + css -- index.css 
                                              |
                                              + img -- tessel.png 
```

## Extending

### User Path Handler

## Shared Resources

### 404 Page 

<hr>
<p align="center">© 2018 J.Motyl</p>
