# Tessel 2 Networking

This repository contains a networking application for the Tessel 2.

- [Goals](#goals)
  * [Potential Uses](#potential-uses)
- [Tessel 2 Development Environment](#tessel-2-development-environment)
  * [Tessel 2 Environment Versions](#tessel-2-environment-versions)
  * [Tessel 2 Network Connections](#tessel-2-network-connections)
- [Running the Application](#running-the-application)
  * [Initial Steps](#initial-steps)
  * [Update the Tessel 2 Firmware](#update-the-tessel-2-firmware)
  * [Download and Run](#download-and-run)
  * [Application Output](#application-output)
    + [Waiting for wlan0](#waiting-for-wlan0)
    + [Collect wlan0 and eth0 Information](#collect-wlan0-and-eth0-information)
    + [Start the HTTP Servers and Scan for Stations](#start-the-http-servers-and-scan-for-stations)
    + [Connected Stations](#connected-stations)
    + [Terminating the Application](#terminating-the-application)
- [Run Time Options](#run-time-options)
  * [Random SSID and WiFi Channel](#random-ssid-and-wifi-channel)
  * [Application Event Handling](#application-event-handling)
    + [Tessel WiFi Events](#tessel-wifi-events)
    + [Station Events](#station-events)
  * [Muting Console Output](#muting-console-output)
  * [HTTP Servers](#http-servers)
    + [Enabling the HTTP Servers](#enabling-the-http-servers)
    + [Folder Hierarchy](#folder-hierarchy)
    + [Application API](#application-api)







    + [Access Point Characteristics](#access-point-characteristics)
      - [Modifying the Access Point Characteristics](#modifying-the-access-point-characteristics)
- [Desired Results](#desired-results)
  * [Actual Access Point Behavior](#actual-access-point-behavior)
  * [Actual LAN Client Behavior](#actual-lan-client-behavior)
- [Test Application Details](#test-application-details)
  * [Application Initialize and Start Up](#application-initialize-and-start-up)
  * [Access Point Initialization](#access-point-initialization)
  * [Display Network Interface Information](#display-network-interface-information)
  * [Shutdown and Disable](#shutdown-and-disable)
- [OpenWRT Configuration](#openwrt-configuration)
- [Tessel 2 Network API Modifications](#tessel-2-network-api-modifications)
- [Tessel 2 Firmware Modifications](#tessel-2-firmware-modifications)
  * [Access Point API Modifications](#access-point-api-modifications)
- [Scratch Pad Section](#scratch-pad-section)
    + [Settings](#settings)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

# Goals

The intended goals are - 

* Create an application that can be used as a template for future projects
* Enable an access point and allow stations to connect, and then provide them with an IP address 
* Disable the Tessel's WiFi station
* Use the Ethernet interface to obtain an IP address via DHCP
* Characterize the behavior of the AP when enabling or disabling programmatically
* Investigate the Tessel's network API and its usage 
* Test modifications to the Tessel's access point API. Current modifications are -
  * Get/Change WIFi channel
  * Get a list of connected stations

At this time routing traffic between the Wifi interface and the Ethernet interface is not required. This will be addressed in a separate application and accompanying documentation.

## Potential Uses

* IoT gateway
* Low power, portable access point
* WiFi Honeypot
* *TBD*

# Tessel 2 Development Environment

Hosted on Windows 10 64bit with Node.js 6.10.2.

## Tessel 2 Environment Versions

* t2-cli: 0.1.8
* t2-firmware: 0.1.0
  * OpenWRT: ? 
* Node.js: 6.10.3

## Tessel 2 Network Connections

The Ethernet port is connected to a LAN/router and will obtain an IP address via DHCP. The wireless interface will act as an access point and as a DHCP server to connected stations.

<p align="center">
  <img src="./mdimg/hw-overview.jpg" alt="Application Initialize flow chart" txt="Application Initialize flow chart" width="50%">
</p>

# Running the Application

In order to use the application it is necessary to modify the Tessel 2 firmware. There is a single JavaScript file that contains entire Tessel 2 API. 

## Initial Steps

Go to the [Tessel 2 Documentation](https://tessel.github.io/t2-start/) and follow the steps up through "Blinky".

The procedure below uses the `scp` command which is not available in any Windows version. So if you are running on Windows you will need to do one of the following - 

* Use the Git Bash shell. If you've installed Git on your Windows machine there's a chance you will have it. Typically it installs a Windows Explorer context menu item. If you right-click on a folder you should see "Git Bash Here" in the menu. If you do, you're all set.
* Install a Windows `scp` program. 
* _TBD_

## Update the Tessel 2 Firmware

1) **_Clone_** this repository, please do not fork unless you're contributing.
2) Open a command line window using your chosen shell in your copy of this repository.
3) Navigate to the `tessel_mods/t2-firmware/node` folder.
4) Type in the following command - 

`# scp -i ~/.tessel/id_rsa ./tessel-export.js root@YOUR_TESSEL:/usr/lib/node`

Where : `YOUR_TESSEL` identifies the Tessel that you're using. It can be the Tessel's IP address, or in _some_ cases it can be the name you gave it when following the official Tessel documentation.

5) Run the command, the copy should be successful.

## Download and Run

After successfully copying the updated `tessel-export.js` file to your Tessel just run this application like any other - 

`# t2 run tessel-ap-test.js`

## Application Output

```
INFO Looking for your Tessel...
INFO Connected to Tessel-01A30CBBDDFF.
INFO Building project.
INFO Writing project to RAM on Tessel-01A30CBBDDFF (72.192 kB)...
INFO Deployed.
INFO Running tessel-ap-test.js...
I'm blinking! (Press CTRL + C to quit and shutdown the AP)



wifi.disable callback - SUCCESS
setting AP channel 2 now...

AP channel = 2
creating AP now...

ap.create event - created :
{
    "ssid": "TESSEL_TEST",
    "password": "12341234$",
    "security": "psk2",
    "channel": 2,
    "ip": "192.168.1.101"
}
ap.create event - enabling AP now...

ap.enable event - enabled

getNetIF() looking for wlan0 - #0
```

### Waiting for wlan0

```
getNetIF() looking for wlan0 - #1
getNetIF() looking for wlan0 - #2
getNetIF() looking for wlan0 - #3
```

### Collect wlan0 and eth0 Information

```
getIPv4(wlan0) -
{
    "address": "192.168.1.101",
    "netmask": "255.255.255.0",
    "family": "IPv4",
    "mac": "01:a3:0c:bb:dd:ff",
    "internal": false
}
getIPv4(eth0) -
{
    "address": "192.168.0.26",
    "netmask": "255.255.255.0",
    "family": "IPv4",
    "mac": "01:a3:0c:bb:dd:ff",
    "internal": false
}
```

### Start the HTTP Servers and Scan for Stations

```
httpsrv : starting up http server on 192.168.1.101:80 /tmp/remote-script/public/www
httpsrv : starting up http server on 192.168.0.26:80 /tmp/remote-script/public/wwwadmin

station scan started...

httpsrv : server is listening on 192.168.1.101:80
httpsrv : server is listening on 192.168.0.26:80

event stations = []
```

### Connected Stations

```json
event stations = [{"mac":"42:77:e8:49:59:a3","ip":"192.168.1.189","host":"SOME_HOSTNAME","tstamp":1527411135,"iface":"wlan0"}]
```

### Terminating the Application

```
^C
Caught interrupt signal

ap.disable event - disabled
```

<hr>

# Run Time Options

The following optional behavior is altered by changing specific boolean variables to either `true` or `false`.

## Random SSID and WiFi Channel 

Choose if the SSID or the WiFi channel are random each time the application is started. This is useful when developing non-client code.

```javascript
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
```

## Application Event Handling

There are two groups of event handlers in the application :

* Tessel WiFi Events
* Station Events

### Tessel WiFi Events

The Tessel Wifi events are used for demonstration and for visualizing the timing of those events with WiFi operations. The application can optionally listen for WiFi events :

* `disconnect`
* `getchannel` <- *new, added with firmware modification*
* `setchannel` <- *new, added with firmware modification*

By default these events are turned off. To enable them and to see console output the following code will require modification to `tessel-ap-test.js` : 

```javascript
// true = enable Tessel wifi events, for demonstration purposes
var show_wifievents = false;
```

**NOTE:** The output to the console must also be enabled, see [Muting Console Output](#muting-console-output).

### Station Events

The station event is triggered when the application requests the list of attached WiFi stations. If this event is disabled the application will use a callback to obtain the connected station list. This event is enabled by default in `tessel-ap-test.js` :

```javascript
// use an event or a callback (if false)
var stations_event = true;
```

## Muting Console Output 

The file `consolelog.js` contains two variables that control whether any output is sent to the console.

```javascript
// default is - both are enabled
con.conlog = true;
con.contrace = true;
```

To mute all console output set both variables to `false`.

## HTTP Servers

There are two http servers in the application. One will be considered as an *administration* portal and the other is for access point clients.

### Enabling the HTTP Servers

There are two HTTP servers that can be enabled where one is listening on the access point's IP address and the other on the Ethernet IP address.

**`tessel-ap-test.js`** :

```javascript
//////////////////////////////////////////////////////////////////////////////
// Optional HTTP Servers
//
// When the following is 'true' there will be two HTTP servers started. One
// will listen on the IP assigned to wlan0 and the other is on eth0.
const httpenable = true;

const httpsrv = require('./tessel-ap-http.js');
var http_wlan = {};
var http_eth = {};
```

### Folder Hierarchy

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

### Application API

The following endpoints are available :

* `GET /info/ip` - return the web client's IP address
* `GET /info/stations` - return the list of currently connected AP stations

Both requests respond with JSON formatted strings.

<hr>















### Access Point Characteristics

* WiFi Channel : This defaults to channel 11.
* AP IP Address : This defaults to 192.168.1.101

In the current Tessel 2 version those properties are only modifiable from within OpenWRT. Please refer to the OpenWRT documentation at [The UCI System](https://openwrt.org/docs/guide-user/base-system/uci) and [WiFi /etc/config/wireless](https://openwrt.org/docs/guide-user/network/wifi/basic) for details. 

#### Modifying the Access Point Characteristics

This will be addressed later in this document under [OpenWRT Configuration](#openwrt-configuration).

# Desired Results

For this application it is expected that :

* The access point will initialize and allow WiFi stations to connect and obtain an IP address with DHCP.
* The duration of time in which the access point initializes and becomes ready for station connections should be a reasonably brief period of time.
* The Ethernet client will obtain an IP address from a DHCP sever on the same network.

## Actual Access Point Behavior

## Actual LAN Client Behavior

It behaves as expected. There are no visible delays in regards to startup and DHCP.

<hr>












# Test Application Design Details

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









# OpenWRT Configuration

In order to modify the configuration you mus use OpenWRT's [UCI System](https://openwrt.org/docs/guide-user/base-system/uci)

# Tessel 2 Network API Modifications

The following functionality has been added - 

* Get/Set the WiFi channel
* Request a list of stations connected to the access point




















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







# Tessel 2 Firmware Modifications

Below are modifications I've made in regards to the proposals mentioned above. 

## Access Point API Modifications

Each *new* setting will be tested using the `UCI` via SSH and the command-line.

**WiFi Channel** : `uci set wireless.@wifi-device[0].channel=6` - Set the WiFi channel to `6`.<br>
**Static AP IP Address** : `uci set network.lan.ipaddr=192.168.1.101` - Set the IP address used by the AP.<br>
**IP Net Mask** : `uci set network.lan.netmask=255.255.255.0` - <br>

**DHCP Start** : `uci set dhcp.lan.start=100` - <br>
**DHCP Limit** : `uci set dhcp.lan.limit=150` - <br>
**DHCP Lease Time** : `uci set dhcp.lan.leasetime=12h` - <br>
See [OpenWRT - DHCP Pools](https://openwrt.org/docs/guide-user/base-system/dhcp_configuration#dhcp_pools) for additional information..

**Connected Stations** : `iw dev wlan0 station dump` - will produce :<br>

```
Station 5c:a8:6a:f4:e8:ee (on wlan0)
        inactive time:  2730 ms
        rx bytes:       33012
        rx packets:     736
        tx bytes:       11621
        tx packets:     67
        tx retries:     6
        tx failed:      29
        signal:         -37 dBm
        signal avg:     -37 dBm
        tx bitrate:     26.0 MBit/s MCS 3
        rx bitrate:     12.0 MBit/s
        expected throughput:    9.612Mbps
        authorized:     yes
        authenticated:  yes
        preamble:       short
        WMM/WME:        yes
        MFP:            no
        TDLS peer:      no
        connected time: 111 seconds
```

And `iwinfo wlan0 assoclist` will produce :<br>

```
5C:A8:6A:F4:E8:EE  -37 dBm / unknown (SNR -37)  70 ms ago
        RX: 12.0 MBit/s, MCS 0, 20MHz                   1189 Pkts.
        TX: 28.9 MBit/s, MCS 3, 20MHz, short GI          107 Pkts.
```
If there are no stations connected - 
```
No station connected
```

For a more manageable list use `arp`, which will produce :<br>

```
IP address       HW type     Flags       HW address            Mask     Device
192.168.1.158    0x1         0x2         23:00:6a:f4:e8:ab     *        wlan0
192.168.0.7      0x1         0x2         10:0a:23:e1:ab:3c     *        eth0
192.168.0.1      0x1         0x2         10:aa:21:d5:0d:99     *        eth0
```

Then refine it a little with this - `arp | grep wlan0`, which will produce :<br>

```
192.168.1.158    0x1         0x2         23:00:6a:f4:e8:ab     *        wlan0
```

And `cat /tmp/dhcp.leases` will give you - <br>

```
1525596466 5c:a8:6a:f4:e8:ee 192.168.1.158 android-72d96d29a805b447 01:5c:a8:6a:f4:e8:ee
```

