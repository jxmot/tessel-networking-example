'use strict';

// provide access to os.networkInterfaces()
const os = require('os');

// Import the interface to Tessel hardware
const tessel = require('tessel');

// turn off ports A and B, not in use so we'll turn off the LEDs
tessel.close();

// Turn one of the user LEDs on to start.
tessel.led[2].on();

// Blink!
var blinkintrvl = setInterval(() => {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 500);

console.log("I'm blinking! (Press CTRL + C to stop)\n\n\n");

//////////////////////////////////////////////////////////////////////////////
// process signal handlers
//
// NOTE: When running the `t2 run` command on Windows use CTRL-C to exit 
// which is caught by `SIGINT`. However CTRL-BREAK(SIGBREAK or  is not caught 
// (in Windows). 
// 
// The end result of using CTRL-C to exit the application on the Tessel is that
// tesselAPcleanup() will be called and the AP will be turned off. As an 
// indicator both of the user LEDs will be turned off just prior to the 
// application exit.

process.on('SIGINT', () => {
    console.log('\nCaught interrupt signal\n');
    tesselAPcleanup();
});

process.on('SIGTERM', () => {
    console.log('\nCaught terminate signal\n');
    tesselAPcleanup();
});

process.on('SIGBREAK', () => {
    console.log('\nCaught break signal\n');
    tesselAPcleanup();
});

//////////////////////////////////////////////////////////////////////////////
function getRandomInt(max,min) {
    return Math.floor(Math.random() * (max - min) + min);
};

const ssidrand = true;
const apssid = (ssidrand === true ? (`YO_${('0000'+getRandomInt(5000,0)).slice(-4)}`) : ('TESSEL_TEST'));

const chanrand = true;
const apchann = (chanrand === true ? getRandomInt(11,1) : 4);

//////////////////////////////////////////////////////////////////////////////
const apconfig = {
        ssid: `${apssid}`,      // required
        password: '12341234$',  // required if network is password-protected
        security: 'psk2',       // available values - none, wep, psk, psk2, default 
                                // is 'none' if no password needed, default is 'psk2' otherwise. 
                                // See https://tessel.io/docs/cli#usage for more info
        channel: apchann
};

// AP IP address (wlan0)
var apip = '';
// AP state
var apready = false;
// ethernet address (eth0)
var ethip = '';

// our servers
const httpsrv = require('./tessel-ap-http.js');
const httpenable = false;
var http_wlan = {};
var http_eth = {};

// getNetIF() will increment this count each time 
// it's called. It will help illustrate the difference
// in when tessel.network.ap.on('enable',...) occurs 
// versus when the AP is actually truly ready for
// station connections.
var netIFcount = 0;
// timer IDs from setInterval() - 
//      AP Ready detection
var netIFid = undefined;
//      Station Scanner
var stationsintrvl = undefined;

// use an event or a callback (if false)
var stations_event = true;

// Tessel network event handlers
tessel.network.wifi.on('error', () => {
    console.log('ERROR - wifi');
});

tessel.network.wifi.on('disconnect', () => {
    console.log('wifi disconnect');
});

tessel.network.wifi.on('getchannel', (error, channel) => {
    console.log(`wifi current channel = ${channel}`);
});

tessel.network.wifi.on('setchannel', (channel) => {
    console.log(`wifi new channel = ${channel}`);
});

var laststations = -1;
var stationlist = {};

if(stations_event === true) {
    // this will run after getStations() has returned
    // a list of attached stations. This is where you
    // would determine if any station(s) have been 
    // added or removed.
    tessel.network.ap.on('stations', (stations) => {
        // `stations` is an array of connected stations.
        if(laststations !== stations.length) {
            console.log(`\nevent stations = ${JSON.stringify(stations)}\n`);
            laststations = stations.length;
            stationlist = JSON.parse(JSON.stringify(stations));
        }
    });
}

// the AP has been created...
tessel.network.ap.on('create', (settings) => {
    console.log('SUCCESS - AP created :');
    console.log(JSON.stringify(settings, null, 4));
    console.log('enabling AP now...\n');
    // enable the AP for use...
    tessel.network.ap.enable();
});

// the AP is enabled (but not necessarily really
// ready to accept connections from stations
tessel.network.ap.on('enable', () => {
    console.log('AP enable event\n');
    netIFid = setInterval(getNetIF, 5000);
    getNetIF();
});

// exit when the AP has been disabled
tessel.network.ap.on('disable', () => {
    console.log('AP disable event\n');

    // turn the LEDs OFF as a indicator of success
    tessel.led[2].off();
    tessel.led[3].off();

    ethip = '';
    apip = '';
    apready = false;

    setTimeout(process.exit, 500);
    // NOTE: Even though we've arrived here because the
    // AP has been disabled, it isn't actually turned off
    // until a measurable amount of time has passed.
    // Typically this has taken 5 to 10 seconds.    
});

// Initialize the AP
tesselAPinit();

//////////////////////////////////////////////////////////////////////////////
// disable the wifi client
function tesselAPinit() {
    // disable the station side of wifi
    tessel.network.wifi.disable((error) => {
        if(error) console.log('ERROR - wifi.disable\n');
        else {
            // success disabling the wifi station
            console.log('SUCCESS - wifi.disable');

            // set the channel
            console.log('setting AP channel '+apconfig.channel+' now...\n');
            tessel.network.wifi.setChannel(apconfig, (error, result) => {
// NOTE: swap the commenting on the "set" with "get" to
// see either of them work.
            // get the current channel
            //console.log('getting AP channel now...\n');
            //tessel.network.wifi.getChannel((error, result) => {
                if(error) console.log('ERROR - wifi.getChannel\n');
                else {
                    console.log('AP channel = '+result);
                    console.log('creating AP now...\n');
                    // create the AP
                    tessel.network.ap.create(apconfig);
                }
            });
        }
    });
};

// clean up on exit, turn the LEDs off and disable the AP
function tesselAPcleanup() {
    clearInterval(stationsintrvl);
    clearInterval(blinkintrvl);
    tessel.network.ap.disable();
};

// list all network interfaces...
// NOTE: rename and/or refactor this function. 

function getNetIF() {
    var netif = os.networkInterfaces();
    console.log(`getNetIF() looking for wlan0 - #${netIFcount}`);
    // uncomment the line below to observe the network 
    // interfaces and the eventual appearance of the 
    // desired "wlan0" IPv4 interface - 
    //console.log(JSON.stringify(netif, null, 4));
    console.log('\n\n');

    // the presence of the "wlan0" interface does not mean 
    // that the AP is ready. The first one to appear is IPv6
    if(netif['wlan0'] === undefined) {
        netIFcount += 1;
    } else {
        // a "wlan0" was found, but it needs two entries. One
        // for IPv6 (first to appear) and one for IPv4
        if(netif['wlan0'].length > 1) {
            // it's likely that the IPv4 has appeared...
            if(netIFid != undefined) {
                // stop the interval timer...
                clearInterval(netIFid);
                // and show the interface we need for the AP
                console.log('wlan0 AP is ready - \n');
// NOTE: verify if netif['wlan0'][0] will ALWAYS be 'IPv4'
                console.log(JSON.stringify(netif['wlan0'][0], null, 4));

                // retrieve the IP and MAC for the access point(wlan0) and
                // mark it as ready if successful
                apip = getIPv4('wlan0');
                apready = ((apip !== undefined) ? true : false);
                // retrieve the IP and MAC for the other interface
                ethip = getIPv4('eth0');

                if(httpenable === true) {
                    // start an http server on the access point address
                    (apready === true ? http_wlan = new httpsrv(apip.ip, 80) : console.log('httpuser not started'));
                    http_eth = new httpsrv(ethip.ip, 80, 'wwwadmin', adminAPI);
                }
                // start scanning for connected stations
                console.log('\nstation scan started...\n');
                stationsintrvl = setInterval(getStations, 5000);
            } 
        } else netIFcount += 1;
    }
};

// retrieve a list of connected stations
function getStations() {
    if(stations_event === true) tessel.network.ap.stations('json');
    else tessel.network.ap.stations('json', cb_getStations);
};

// callback for tessel.network.ap.stations()
function cb_getStations(error, stations) {
    if(!error) {
        console.log(`\ncallback stations = ${JSON.stringify(stations)}\n`);
        laststations = stations.length;
        stationlist = JSON.parse(JSON.stringify(stations));
    } else console.log('callback ERROR');
};

// retrieve the IPv4 address of the specified interface
function getIPv4(_iface) {
    var addrinfo = {
        ip: '',
        mac: ''
    };

    var iface = ((_iface.toLowerCase() === 'wlan0' || _iface.toLowerCase() === 'eth0') ? _iface.toLowerCase() : 'UNKNWN');
    if(iface !== 'UNKNWN') {
        var netif = os.networkInterfaces();
        if(netif[iface] !== undefined) {
            for(var ix = 0;ix < netif[iface].length;ix++) {
                if(netif[iface][ix]['family'] === 'IPv4') {
                    addrinfo.ip = netif[iface][ix]['address'];
                    addrinfo.mac = netif[iface][ix]['mac'];
                    break;
                }
            }
        } else addrinfo = undefined;
    } else addrinfo = undefined;
    return addrinfo;
};

// passed to httpserver.init(), where it is called
// and expected to return either -
//      'false' = response not sent
//      'true'  = response was sent
function adminAPI(reqpath, req, res) {
    let bRet = false;

    if(reqpath.includes('/info/') === true) {
        switch(reqpath) {
            case '/info/ip' :
                res.statusCode = 200;
                let ipx = req.headers["x-forwarded-for"];
                if(ipx) {
                    let list = ipx.split(",");
                    ipx = list[list.length-1];
                } else ipx = req.connection.remoteAddress;
                res.end(`${ipx}`);
                bRet = true;
                break;

            case '/info/stations':
                res.statusCode = 200;
                res.setHeader('Content-type', mime.types['.json']);
                res.end(JSON.stringify(stationlist));
                break;

            case '/info/TBD':
            default:
                res.statusCode = 501;
                res.end(`unknown ${reqpath} - ${err}`);
                bRet = true;
                break;
        };
    }

    return bRet;
};

