# Tessel 2 Firmware Modifications



* Resources used : 
    * [The UCI System](https://openwrt.org/docs/guide-user/base-system/uci)
    * [OpenWRT Wireless configuration / Wifi Networks](https://wiki.openwrt.org/doc/uci/wireless#wifi_networks)

* Affected File(s) :
    * `/etc/config/wireless` - via `uci` commands run by the API
    * `node/tessel-export.js` - API modifications


# Tessel 2 API Overview

The Tessel 2 API is contained in `tessel-export.js`, and it utilizes :

* The Node.js native package - `child_process`
* Promises

There is more, however that's not relevant to this document.

# Access Point API Modifications

Three API functions have been created :

* Get current WiFi channel : `tessel.network.wifi.getChannel()`
* Set new WiFi channel : `tessel.network.wifi.setChannel()`
* Get list of stations currently connected to the access point : `tessel.network.ap.stations()`

# Design Details

## Get or Set WiFi Channel

## Request Station List




# Future Modifications













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

