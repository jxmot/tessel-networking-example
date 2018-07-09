'use strict';
/*
    tessel-ap-test.js - An application for testing how the 
    Tessel 2 network API works, and for the development and
    testing of new network API functions.

    This application when ran will - 

        * Blink the user LEDs
        * Start the access point 
        * Scan for connected WiFi stations and report them
          when first seen
        * Start two http servers, one on WiFi and the other
          on the ethernet connection. Wifi is "client" and
          ethernet is "admin"
        * Wait for termination signals, and when one occurs
          the access point is turned off and the LEDs stop
          blinking

    Current new network API functions are - 

        * get current wifi channel number
        * change current wifi channel number
        * get currently connected AP stations

    (c) 2018 j.motyl - https://github.com/jxmot
*/
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

console.log("I'm blinking! (Press CTRL + C to quit and shutdown the AP)\n\n\n");

// Unmute/mute console output.
const _con = require('./consolelog.js');
// decide if con.log() or con.trace() will
// produce output
const con = new _con(true, true);

//////////////////////////////////////////////////////////////////////////////
// Process Signal Handlers
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
    con.trace('\nCaught interrupt signal\n');
    tesselAPcleanup();
});

process.on('SIGTERM', () => {
    con.trace('\nCaught terminate signal\n');
    tesselAPcleanup();
});

process.on('SIGBREAK', () => {
    con.trace('\nCaught break signal\n');
    tesselAPcleanup();
});

//////////////////////////////////////////////////////////////////////////////
// Random SSID & WiFi Channel
//
// Each time the application is started and when either of the following 
// are 'true' then the SSID or WiFi channel will be somewhat randomized.
// The channel will range from 1 through 11, and the random ssid will be
// from "TEMP_0000" through "TEMP_5000".
const ssidrand = false;
const chanrand = true;

const MIN_WIFI_CHAN = 1;
const MAX_WIFI_CHAN = 11;

const MIN_SSID_NUMB = 0;
const MAX_SSID_NUMB = 5000;

// when random is off use these
const ssid = 'TESSEL_TEST';
const chan = 8;
// when the ssid is random this first half of the ssid.
const rssid = 'TEMP_';
// get the ssid and wifi channel for this session
const apssid = (ssidrand === true ? (`${rssid}${('0000'+getRandomInt(5000,0)).slice(-4)}`) : ssid);
const apchann = (chanrand === true ? getRandomInt(MAX_WIFI_CHAN,MIN_WIFI_CHAN) : chan);

function getRandomInt(max,min) {
    return Math.floor(Math.random() * (max - min) + min);
};

//////////////////////////////////////////////////////////////////////////////
// Access Point Configuration
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

//////////////////////////////////////////////////////////////////////////////
// Miscellaneous application settings

// true = enable Tessel wifi events, for demonstration purposes
var show_wifievents = false;

//////////////////////////////////////////////////////////////////////////////
// Optional HTTP Servers
//
// When the following is 'true' there will be two HTTP servers started. One
// will listen on the IP assigned to wlan0 and the other is on eth0.
const httpenable = true;

const httpsrv = require('./tessel-ap-http.js');
var http_wlan = {};
var http_eth = {};

//////////////////////////////////////////////////////////////////////////////
// Run-time Variables
//
// 
// waitForWlan() will increment this count each time 
// it's called. It will help illustrate the difference
// in when tessel.network.ap.on('enable',...) occurs 
// versus when the AP is actually truly ready for
// station connections.
var wlanWaitCount = 0;
// timer IDs from setInterval() - 
//      AP Ready detection
var wlanTimerID = undefined;
//      Station Scanner
var stationsintrvl = undefined;

// use an event or a callback (if false)
var stations_event = true;

// last station count, and the current list
var laststations = -1;
var stationlist = {};

//////////////////////////////////////////////////////////////////////////////
// Tessel network event handlers
//
tessel.network.wifi.on('error', () => {
    console.error('network.wifi event - ERROR');
});

if(show_wifievents === true) {
    // In this application the Tessel wifi and ap 
    // events & callbacks are used. This was done
    // in order to see when the events occurred in 
    // relationship to when the callback functions
    // are called.
    tessel.network.wifi.on('disconnect', () => {
        con.log('wifi.disconnect event - disconnected');
    });
    
    tessel.network.wifi.on('getchannel', (error, channel) => {
        con.log(`wifi.getchannel event - channel = ${channel}`);
    });
    
    tessel.network.wifi.on('setchannel', (channel) => {
        con.log(`wifi.setchannel event - channel = ${channel}`);
    });
}

if(stations_event === true) {
    // this will run after getStations() has returned
    // a list of attached stations. This is where you
    // would determine if any station(s) have been 
    // added or removed.
    tessel.network.ap.on('stations', (stations) => {
        // `stations` is an array of connected stations.
        let tmp = 0;
        if(laststations !== (tmp = checksum(JSON.stringify(stations)))) {
            con.trace(`\nevent stations = ${JSON.stringify(stations)}\n`);
            laststations = tmp;
            stationlist = JSON.parse(JSON.stringify(stations));
        }
    });
}

/*
    Checksum - creates a checksum for a string and returns
    the checksum value in a string (or as an integer).
    Originally found at - https://stackoverflow.com/a/3276730/6768046

    And modified by - https://github.com/jxmot
*/
function checksum(s, type = 'i')
{
    var chk = 0x5F378EA8;
    var len = s.length;
    for (var i = 0; i < len; i++) chk += (s.charCodeAt(i) * (i + 1));
    if(type === 's') return (chk & 0xffffffff).toString(16);
    else return (chk & 0xffffffff);
};

//////////////////////////////////////////////////////////////////////////////
// Tessel Network Event Handlers
// 
// the AP has been created...
tessel.network.ap.on('create', (settings) => {
    con.log('ap.create event - created :');
    con.log(JSON.stringify(settings, null, 4));
    con.log('ap.create event - enabling AP now...\n');
    // enable the AP for use...
    tessel.network.ap.enable();
});

// the AP is enabled (but not necessarily really
// ready to accept connections from stations
tessel.network.ap.on('enable', () => {
    con.trace('ap.enable event - enabled\n');
    // begin a periodic check to see if
    // the AP is truly ready for use
    wlanTimerID = setInterval(waitForWlan, 5000);
    waitForWlan();
});

// clean up and exit when the AP has been disabled
tessel.network.ap.on('disable', () => {
    con.trace('ap.disable event - disabled\n');
    // turn the LEDs OFF as a indicator of success
    tessel.led[2].off();
    tessel.led[3].off();
    // clear these in case this is part of soft restart
    ethip = '';
    apip = '';
    apready = false;

    setTimeout(process.exit, 500);
    // NOTE: Even though we've arrived here because the
    // AP has been disabled, it isn't actually turned off
    // until a measurable amount of time has passed.
    // Typically this has taken 5 to 10 seconds.    
});

// Initialize the AP...
tesselAPinit();

//////////////////////////////////////////////////////////////////////////////
// Application Functions
//
// disable the wifi client
function tesselAPinit() {
    // disable the station side of wifi
    tessel.network.wifi.disable((error) => {
        if(error) console.error('wifi.disable callback - ERROR\n');
        else {
            // success disabling the wifi station
            con.log('wifi.disable callback - SUCCESS');

            // set the channel
            con.log('setting AP channel '+apconfig.channel+' now...\n');
            tessel.network.wifi.setChannel(apconfig, (error, result) => {
                if(error) console.error('ERROR - wifi.setChannel\n');
                else {
                    con.log('AP channel = '+result);
                    con.log('creating AP now...\n');
                    // create the AP, handle with an event
                    tessel.network.ap.create(apconfig);
                }
            });
        }
    });
};

// clean up on exit...
function tesselAPcleanup() {
    // stop scanning for stations
    clearInterval(stationsintrvl);
    // stop the blinkin' LEDs
    clearInterval(blinkintrvl);
    // the event handler will complete the cleanup
    tessel.network.ap.disable();
};

// Check for the presence of wlan0 and the IPv4
// address. When found stop checking and continue
// the initialization.
function waitForWlan() {
    let netif = os.networkInterfaces();
    con.log(`waitForWlan() looking for wlan0 - #${wlanWaitCount}`);
    // uncomment the line below to observe the network 
    // interfaces and the eventual appearance of the 
    // desired "wlan0" IPv4 interface - 
    //console.log(JSON.stringify(netif, null, 4));

    // the presence of the "wlan0" interface does not indicate 
    // that the AP is ready. The first one to appear is IPv6, it
    // works that way on a Tessel 2.
    if(netif['wlan0'] === undefined) {
        wlanWaitCount += 1;
    } else {
        // a "wlan0" was found, but it needs two entries. One
        // for IPv6 (first to appear) and one for IPv4
        if(netif['wlan0'].length > 1) {
            // it's likely that the IPv4 has appeared...
            if(wlanTimerID != undefined) {
                // so let's stop scanning the network interfaces...
                clearInterval(wlanTimerID);


                // retrieve the IP and MAC for the wired interface
                ethip = getIPv4('eth0');
                // retrieve the IP and MAC for the access point(wlan0) and
                // mark it as ready if successful
                apip = getIPv4('wlan0');
                apready = ((apip !== undefined) ? true : false);
                con.trace(`waitForWlan() apready = ${apready}`);
//event??? apready
//handler???


                // are the http servers enabled?
                if(httpenable === true) {
                    // start an http server on the access point address
                    (apready === true ? http_wlan = new httpsrv(apip.ip, 80, 'www', adminAPI) : console.error(`http_wlan not started, apready = ${apready}`));
                    // start an http server on the wired interface address
                    http_eth = new httpsrv(ethip.ip, 80, 'wwwadmin', adminAPI);
                }


                // start scanning for connected stations
                con.log('\nstation scan started...\n');
                stationsintrvl = setInterval(getStations, 5000);
//^handler???
            } 
        } else wlanWaitCount += 1;
    }
};

// retrieve a list of connected stations
function getStations() {
    // can choose one of two notification methods, 
    // a callback function or an event
    if(stations_event === true) tessel.network.ap.stations();
    else tessel.network.ap.stations(cb_getStations);
};

// callback for tessel.network.ap.stations()
function cb_getStations(error, stations) {
    if(!error) {
        let tmp = 0;
        if(laststations !== (tmp = checksum(JSON.stringify(stations)))) {
            con.trace(`\ncallback stations = ${JSON.stringify(stations)}\n`);
            laststations = tmp;
            stationlist = JSON.parse(JSON.stringify(stations));
        }
    } else console.error('callback ERROR');
};

// retrieve the IPv4 address of the specified interface
function getIPv4(_iface) {
    let addrinfo = {
        ip: '',
        mac: ''
    };
    // make sure it's a valid interface
    let iface = ((_iface.toLowerCase() === 'wlan0' || _iface.toLowerCase() === 'eth0') ? _iface.toLowerCase() : 'UNKNWN');
    if(iface !== 'UNKNWN') {
        // it's good, ask for the list of current interfaces
        let netif = os.networkInterfaces();
        // are there any?
        if(netif[iface] !== undefined) {
            // yes, step through the interface and find the ipv4 
            // information
            for(let ix = 0;ix < netif[iface].length;ix++) {
                if(netif[iface][ix]['family'] === 'IPv4') {
                    addrinfo.ip  = netif[iface][ix]['address'];
                    addrinfo.mac = netif[iface][ix]['mac'];
                    con.log(`getIPv4(${iface}) - `);
                    con.log(JSON.stringify(netif[iface][ix], null, 4));
                    break;
                }
            }
        } else addrinfo = undefined;
    } else addrinfo = undefined;
    return addrinfo;
};

// Custom path handling for the http server
//
// passed to httpserver.init(), where it is called
// and expected to return either -
//      'false' = response not sent
//      'true'  = response was sent
function adminAPI(reqpath, req, res, server) {
    let bRet = false;
    if(reqpath.includes('/info/') === true) {
        switch(reqpath) {
            // return the requester's IP address
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

            // respond with a list of attached WiFi stations
            case '/info/stations':
                res.statusCode = 200;
                con.log(server.mimetype('.json'));
                res.setHeader('Content-type', server.mimetype('.json'));
                res.end(JSON.stringify(stationlist));
                con.log(`stationlist = ${JSON.stringify(stationlist,null,2)}`);
                bRet = true;
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

