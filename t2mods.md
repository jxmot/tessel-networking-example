# Tessel 2 Firmware Modifications

- [Tessel 2 API Review](#tessel-2-api-overview)
- [Access Point API Modifications](#access-point-api-modifications)
- [Design Details](#design-details)
  * [Get or Set WiFi Channel](#get-or-set-wifi-channel)
  * [Request Station List](#request-station-list)
- [Future Modifications](#future-modifications)
  * [Access Point Functions](#access-point-functions)
    + [UCI Access Point Commands](#uci-access-point-commands)
  * [DHCP Functions](#dhcp-functions)
    + [UCI DHCP Commands](#uci-dhcp-commands)
  * [WiFi Functions](#wifi-functions)
    + [UCI DHCP Commands](#uci-dhcp-commands-1)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

**Related Documents:**
* [Project README](https://github.com/jxmot/tessel-networking-example/blob/master/README.md)
* [Application Design Details](https://github.com/jxmot/tessel-networking-example/blob/master/appdesign.md)
* [Web Server Design Details](https://github.com/jxmot/tessel-networking-example/blob/master/aphttp.md)

# Tessel 2 API Review

* Resources used : 
    * [The UCI System](https://openwrt.org/docs/guide-user/base-system/uci)
    * [OpenWRT Wireless configuration / Wifi Networks](https://wiki.openwrt.org/doc/uci/wireless#wifi_networks)

* Affected File(s) :
    * `/etc/config/wireless` - via `uci` commands run by the API
    *  [`/t2-firmware`](https://github.com/tessel/t2-firmware)`/node/tessel-export.js` - API modifications

The Tessel 2 API is contained in `tessel-export.js`, and it utilizes :

* The Node.js native package : `child_process`
    * A majority of the API functions use `child_process.exec()` to execute OpenWRT command line utilities 
* Promises

There is more, however that's not relevant to this document.

# Access Point API Modifications

Three API functions have been created :

* Get current WiFi channel : `tessel.network.wifi.getChannel()`
* Set new WiFi channel : `tessel.network.wifi.setChannel()`
* Get list of stations currently connected to the access point : `tessel.network.ap.stations()`

# Design Details

Each of the new functions also make use of `child_process` and promises. 

## Get or Set WiFi Channel

The new functions are :

```javascript
  getChannel(callback) {
    callback = enforceCallback(callback);
    channel({},'get')
      .then(result => emitAndCallback(`getchannel`, this, result, callback))
      .catch(error => emitErrorCallback(this, error, callback));
  };
```

**and**

```javascript
  setChannel(settings, callback) {
    callback = enforceCallback(callback);
    channel(settings,'set')
      .then(commitWireless)
      .then(result => emitAndCallback(`setchannel`, this, result, callback))
      .catch(error => emitErrorCallback(this, error, callback));
  };
```

Each calls a new common function :

```javascript
function channel(settings,action) {
  const ucigetchannel = `uci get wireless.@wifi-device[0].channel`;
  const ucisetchannel = `uci set wireless.@wifi-device[0].channel=${settings.channel}`;

  let act = (typeof action === 'string' ? (action.length === 3 ? action.toLowerCase() : 'get') : 'get');
  let uciact = (act === 'set' ? ucisetchannel : ucigetchannel);

  return new Promise(resolve => {
      cp.exec(uciact, (error, result) => {
      if (error) {
        throw error;
      }
      if(act === 'set') resolve(settings.channel);
      else resolve(result);
    });
  });
}
```

Both functions can *optionally* return their result either through a call back function or an event. This allows for some flexibility in designs that use these functions.

The `tessel.network.wifi.setChannel()` function makes use of the same object as the original `tessel.network.ap.create()` function for passing in access point settings :

```javascript
// Access Point Configuration
const apconfig = {
        ssid: 'UR_SSID',        // required
        password: '12341234$',  // required if network is password-protected
        security: 'psk2',       // available values - none, wep, psk, psk2, default 
                                // is 'none' if no password needed, default is 'psk2' otherwise. 
                                // See https://tessel.io/docs/cli#usage for more info
        channel: 8              // a channel number
};
```

Here's an example using a call back :

```javascript
// set the channel (with callback)
console.log('setting AP channel '+apconfig.channel+' now...\n');
tessel.network.wifi.setChannel(apconfig, (error, result) => {
    if(error) console.error('ERROR - wifi.setChannel\n');
    else {
        console.log('AP channel = '+result);
        console.log('creating AP now...\n');
        // create the AP, handle with an event
        tessel.network.ap.create(apconfig);
    }
});
```

Here's another using an event : 

```javascript
// set the channel (with event)
console.log('setting AP channel '+apconfig.channel+' now...\n');
tessel.network.wifi.setChannel(apconfig);
// do other stuff or go idle

// After a channel is set continue and enable the AP
tessel.network.ap.on('setchannel', (result) => {
    console.log('AP channel = '+result);
    console.log('creating AP now...\n');
    // create the AP, handle with an event
    tessel.network.ap.create(apconfig);
});
```

## Request Station List

The new functions is :

```javascript
  stations(callback) {
    callback = enforceCallback(callback);
    getStations()
    .then(result => {
        emitAndCallback('stations', this, result, callback);
    })
    .catch(error => emitErrorCallback(this, error, callback));
  }
```

This functionality is more complex than setting the WiFi channel. It requires chaining of promises and the use of `Promise.all()`.

```javascript
function getStations() {
    var _stalist = [];
    return new Promise((resolve,reject) => {
        getNetIFs()
        .then(netifs => {
            if(netifs.length === 0) reject(new Error('netif length=0'));
            else {
                let prom = [];
                netifs.forEach((netif, index) => {
                    prom.push(getMACsFromNetIF(netif));
                });
                Promise.all(prom).then(ifacemacs => {
                    let prom2 = [];
                    // this will always be 1 even if empty
                    if(ifacemacs.length === 0) reject(new Error('ifacemacs length=0'));
                    ifacemacs.forEach((iface, iface_idx) => {
                        iface['mlist'].forEach((mac, index) => {
                            prom2.push(getMACInfo(ifacemacs[iface_idx].iface, mac));
                        });
                    });

                    Promise.all(prom2).then(station => {
                        station.forEach((found, index) => {
                            _stalist.push(found);
                        });
                        resolve(_stalist);
                    });
                });
            }
        });
    });
};

function getNetIFs() {
    return new Promise(resolve => {
        cp.exec('iw dev | grep Interface | cut -f 2 -s -d" "', (error, _ifaces) => {
            if (error) {
                throw error;
            }
            // ifaces will contain all of the wireless interface names, typically
            // on the tessel it would just be "wlan0"
            let ifaces = (_ifaces.trim() != '') ? _ifaces.split('\n').filter(function(el) {return el.length != 0}) : [];
            resolve(ifaces);
        });
    });
};

function getMACsFromNetIF(netif) {
    return new Promise(resolve => {
        cp.exec(`iw dev ${netif} station dump | grep Station | cut -f 2 -s -d" "`, (error, _maclist) => {
            if (error) {
                throw error;
            }
            let maclist = (_maclist.trim() !== '') ? _maclist.split('\n').filter(function(el) {return el.length != 0}) : [];
            let result = {
                'iface': netif,
                'mlist': maclist
            };
            resolve(result);
        });
    });
};

function getMACInfo(iface, mac) {
    let station = {};
    return new Promise((resolve,reject) => {
        if(mac !== '') {
            getMACInfo_ip(mac)
            .then(station => {
                getMACInfo_host(station)
                .then(station => {
                    getMACInfo_lease(station)
                    .then(station => {
                        station.iface = iface;
                        resolve(station);
                    });
                });
            });
        } else reject(new Error('mac = ""'));
    });
};

function getMACInfo_ip(mac) {
    let station = {};
    return new Promise(resolve => {
        cp.exec(`cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep ${mac} | cut -f 2 -s -d" "`, (error, ip) => {
            if (error) {
                throw error;
            }
            station.mac = mac.toString();
            station.ip = ip.replace(/(\r\n\t|\n|\r\t)/gm,'');
            resolve(station);
        });
    });
};

function getMACInfo_host(station) {
    return new Promise(resolve => {
        cp.exec(`cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep ${station.mac} | cut -f 3 -s -d" "`, (error, host) => {
            if (error) {
                throw error;
            }
            station.host = host.replace(/(\r\n\t|\n|\r\t)/gm,'');
            resolve(station);
        });
    });
};

function getMACInfo_lease(station) {
    return new Promise(resolve => {
        cp.exec(`cat /tmp/dhcp.leases | grep ${station.mac} | cut -f 1 -s -d" "`, (error, tstamp) => {
            if (error) {
                throw error;
            }
            station.tstamp = parseInt(tstamp.replace(/(\r\n\t|\n|\r\t)/gm,''));
            resolve(station);
        });
    });
};
```

Like the channel functions the station list can be returned via a call back or an event. It is the responsibility of the client application to make periodic list requests and determine if stations have either connected or disconnected.

```javascript
// Station Scanner
var stationsintrvl = undefined;

// start scanning for connected stations
con.log('\nstation scan started...\n');
stationsintrvl = setInterval(getStations, 5000);

// last station count, and the current list
var laststations = -1;
var stationlist = {};

// this will run after getStations() has returned
// a list of attached stations. This is where you
// would determine if any station(s) have been 
// added or removed.
tessel.network.ap.on('stations', (stations) => {
    // `stations` is an array of connected stations.
    let tmp = 0;
    if(laststations !== (tmp = checksum(JSON.stringify(stations)))) {
        console.log(`\nevent stations = ${JSON.stringify(stations)}\n`);
        laststations = tmp;
        stationlist = JSON.parse(JSON.stringify(stations));
    }
});

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
```

# Future Modifications

Each of the following sections will describe *proposed* API functions, and the `uci` commands required to make them work.

## Access Point Functions

* `tessel.network.ap.setIP()`
* `tessel.network.ap.getIP()` - not necessary, the IP address is provided after the access point has been created with `tessel.network.ap.create()`.
* `tessel.network.ap.setNetMask()`
* `tessel.network.ap.getNetMask()`

### UCI Access Point Commands

**Set Static AP IP Address** : `uci set network.lan.ipaddr=192.168.1.101`<br>
**Get Static AP IP Address** : `uci get network.lan.ipaddr`<br>
**Set IP Net Mask** : `uci set network.lan.netmask=255.255.255.0`<br>
**Get IP Net Mask** : `uci get network.lan.netmask`<br>

## DHCP Functions

* `tessel.network.dhcp.setStartLimit()`
* `tessel.network.dhcp.setLeaseTime()`

### UCI DHCP Commands

**DHCP Start** : `uci set dhcp.lan.start=100`<br>
**DHCP Limit** : `uci set dhcp.lan.limit=150`<br>
**DHCP Lease Time** : `uci set dhcp.lan.leasetime=12h`<br>

See [OpenWRT - DHCP Pools](https://openwrt.org/docs/guide-user/base-system/dhcp_configuration#dhcp_pools) for additional information..

## WiFi Functions

* `tessel.network.wifi.setMACWhiteList()`
* `tessel.network.wifi.setMACBlackList()`
* `tessel.network.wifi.disableMACList()`

### UCI DHCP Commands

*None at this time.*

<hr>
<p align="center">© 2018 J.Motyl</p>

