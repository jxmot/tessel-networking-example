# Tessel 2 Networking

**NOTE : This document is a "work-in-progress". It is likely to change, when this message is no longer present this document can be considered ready for use.**

This repository contains a networking application for the Tessel 2.

# Purpose

The *basic* intended purposes are - 

* Enable an access point and allow clients to connect to it and provide them with an IP address 
* Use the Ethernet interface to obtain an IP address via DHCP
* Characterize the behavior of the AP when enabling or disabling programmatically
* Investigate the Tessel's network API and its usage 
* Test modifications to the Tessel's access point API

At this time routing traffic between the Wifi interface and the Ethernet interface is not required. This will be addressed in a separate application and accompanying documentation.

# Tessel 2 Development Environment

Hosted on Windows 10 64bit with Node.js 6.10.2.

## Tessel 2 Environment Versions

* t2-cli: 0.1.8
* t2-firmware: 0.1.0
* Node.js: 6.10.3

## Tessel 2 Network Connections

The Ethernet port is connected to a LAN/router and will obtain an IP address via DHCP. The wireless interface will act as a DHCP server and provide IP addresses to connected stations.

### Access Point Set Up

There are two methods for setting up the Tessel's access point - 

* **CLI** : `t2 ap -n SSID -p password -s pk2`
* **Programmatically** : See [`tessel-ap-test.js`](./tessel-ap-test.js) for details

For the purpose of this document and the application **programmatic** methods will be used.

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

# Test Application Details

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
  <img src="./mdimg/flow-1-601x916.png" alt="Application Initialize flow chart" txt="Application Initialize flow chart" width="50%">
</p>

## Access Point Initialization

As previously mentioned in this document a programmatic method for initializing the Tessel access point is used. Here is an overview of how it's been accomplished :  

<p align="center">
  <img src="./mdimg/flow-2-991x575.png" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="85%">
</p>

## Display Network Interface Information

After the access point has been created and enabled a periodic call to `os.networkInterfaces()` is made and its returned data is checked for the presence of an array labeled as `"wlan0"`. When it is present and containing two elements it's evidence that the access point is running and available.

<p align="center">
  <img src="./mdimg/flow-3-391x871.png" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="40%">
</p>

## Shutdown and Disable



<p align="center">
  <img src="./mdimg/flow-4-676x410.png" alt="Access Point Initialization flow chart" txt="Access Point Initialization flow chart" width="75%">
</p>

<hr>

# OpenWRT Configuration

In order to modify the 

[The UCI System](https://openwrt.org/docs/guide-user/base-system/uci)

## Unknowns

At this time I do not know if there are any OpenWRT configurable items that will affect the behavior seen in the programmatic configuration of the Tessel access point.

<hr>

# Tessel Network API Questions

Here are some questions that were asked in regards to the Tessel 2 Network API. As I obtain answers and test the results this section will be updated.

**Q** : Does the API provide any events when a station connects to the access point?

**A** : Not at this time. However I am investigating the possibility of adding such events.

**Notes** : I have found a possible solution, there are CLI commands that will return information that shows connected stations. If there is no "built in" event I can use then I'll create a function in `tessel-export.js` that retrieves the necessary info and repackages it as needed. It will be up to the Tessel application code to perform periodic "reads" and make determine if a new station was added, or if an existing one has disconnected.

<br>

**Q** : 

**A** : 

<br>

**Q** : 

**A** : 

<br>
<hr>

# Tessel 2 Network API Modification Proposals

* **Access Point** :
    * Provide the ability to programmatically configure -
        * AP IP address
        * AP Channel number
        * DHCP lease duration
        * Maximum *allowed* quantity of connected stations
    * New events - 
        * `tessel.network.ap.on('stationconnect', function(station) {/* manage station connections */});`
            * the  `station` argument is an object containing station information. (*See below*)
        * `tessel.network.ap.on('stationdisconnect', function(station) {/* manage station disconnections */});`
            * the  `station` argument is an object containing station information. (*See below*)
    * New method(s) - 
        * `var apstatus = tessel.network.ap.status();`
            * `apstatus` is an object. (*See below*)

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
    "enabled":[false or true],
    "connections": [0 to n],
}
```

* **Station** : 
   * Clear/remove all station configuration settings, such as SSID, password, and encryption.
   * *TBD*

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


# Scratch Pad Section

this section is just a container for stuff I may or may not retain for this document. **consider it to be temporary and very likely to change or be removed.**

* Resources used : 
    * [OpenWRT Wireless configuration / Wifi Networks](https://wiki.openwrt.org/doc/uci/wireless#wifi_networks)
* Affected File(s) :
    * ` /etc/config/wireless` - via `uci`
    * `node/tessel-export.js`

```uci
config wifi-device 'radio0'
        option type 'mac80211'
        option channel '11'
        option hwmode '11g'
        option path '10180000.wmac'
        option htmode 'HT20'
        option disabled '0'

config wifi-iface
        option device 'radio0'
        option network 'wifi'
        option mode 'sta'
        option key 'password'
        option ssid 'SOME_SSID'
        option encryption 'psk2'
        option disabled '1'

config wifi-iface
        option device 'radio0'
        option network 'lan'
        option mode 'ap'
        option encryption 'psk2'
        option key '12341234$'
        option ssid 'TESSEL_TEST'
        option disabled '1'
```

Then in `node/tessel-export.js:createNetwork(settings)` change ` const commands` to be :

```javascript
  const commands = `
    uci batch <<EOF
    set wireless.@wifi-iface[1].ssid="${settings.ssid}"
    set wireless.@wifi-iface[1].key="${settings.password}"
    set wireless.@wifi-iface[1].encryption="${settings.security}"
    EOF
  `;
```

### Settings


