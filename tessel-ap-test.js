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

const apconfig = {
        ssid: 'TESSEL_TEST',        // required
        password: '12341234$',      // required if network is password-protected
        security: 'psk2',           // available values - none, wep, psk, psk2, default 
                                    // is 'none' if no password needed, default is 'psk2' otherwise. 
                                    // See https://tessel.io/docs/cli#usage for more info
        channel: 4
};

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

// Tessel network event handlers
tessel.network.wifi.on('error', () => {
    console.log('ERROR - wifi');
});

// this will run after getStations() has returned
// a list of attached stations. This is where you
// would determine if any station(s) have been 
// added or removed.
tessel.network.ap.on('stations', (result) => {
    // `result` is an array of connected stations.
    console.log('stations = '+JSON.stringify(result));
});

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
            console.log('creating AP now...\n');
            // create the AP
            tessel.network.ap.channel(apconfig);
            tessel.network.ap.create(apconfig);
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
                console.log(JSON.stringify(netif['wlan0'][0], null, 4));
                // start scanning for connected stations
                console.log('\nstation scan started...\n');
                stationsintrvl = setInterval(getStations, 5000);
            } 
        } else netIFcount += 1;
    }
};

function getStations() {
    tessel.network.ap.stations('json');
};
