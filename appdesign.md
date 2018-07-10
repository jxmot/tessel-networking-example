# Test Application Design Details

# Tessel 2 Network API Modifications

The following functionality has been added - 

* Get/Set the WiFi channel
* Request a list of stations connected to the access point


## Application Initialize and Start Up

The `t2 init` command creates an `index.js` file with the following - 

```javascript
'use strict';

// Import the interface to Tessel hardware
const tessel = require('tessel');

// Turn one of the LEDs on to start.
tessel.led[2].on();

// Blink!
setInterval(() => {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 100);
```

A variation of that code is used in this application for the purpose of indicating that it is running. Additions to it include - 

* Turning off the GPIO ports, which has the side effect of turning off the PORT A and PORT B LEDs.
* Increasing the blink interval to 500ms.
* Saving the timer id for a subsequent call to `clearInterval()`.

In addition, `index.js` has been renamed to `tessel-ap-test.js`.

The remainder of the code in `tessel-ap-test.js` consistutes the testing code for this application. Here is an overview of its operation :

<p align="center">
  <img src="./mdimg/flow-1.jpg" alt="Application Initialize flow chart" txt="Application Initialize flow chart" width="55%">
</p>

## Access Point Initialization

As previously mentioned in this document a programmatic method for initializing the Tessel access point is used. Here is an overview of how it's been accomplished :  

<p align="center">
  <img src="./mdimg/flow-2.jpg" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="80%">
</p>

## Display Network Interface Information

After the access point has been created and enabled, a periodic call to `os.networkInterfaces()` is made and its returned data is checked for the presence of an array labeled as `"wlan0"`. When it is present and containing two elements it is evidence that the access point is running and available.

<p align="center">
  <img src="./mdimg/flow-3.jpg" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="60%">
</p>


## HTTP Servers



## Shutdown and Disable

<p align="center">
  <img src="./mdimg/flow-4.jpg" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="60%">
</p>

<hr>

**`stationconnect`** object :

The `station` object will contain - 

On successful connection to the AP (*With appropriate differences for `IPv6`*) :
```json
{
    "connected":true,
    "address": "192.168.1.X",
    "netmask": "255.255.255.0",
    "family": "IPv4",
    "mac": "00:11:22:33:44:55"
}
```

**`stationdisconnect`** object :

On successful disconnection from the AP (*With appropriate differences for `IPv6`*) :

```json
{
    "connected":false,
    "address": "192.168.1.X",
    "mac": "00:11:22:33:44:55"
}
```

**`apstatus`** object :

The AP status could be reported as - 
```json
{
    "enabled":false,
    "connections": 0,
}
```

Where - 

**`enabled`** - Can be `false` or `true`, inicates the state of the access point.
**`connections`** - Can range from `0` to `n`, the maximum value depends on the OpenWRT configuration.

<hr>

