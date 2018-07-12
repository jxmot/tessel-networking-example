# Tessel 2 Firmware Modifications



**Related Documents:**
* [Project README](https://github.com/jxmot/tessel-networking-example/blob/master/README.md)
* [Tessel 2 Firmware Modifications](https://github.com/jxmot/tessel-networking-example/blob/master/t2mods.md)
* [Web Server Design Details](https://github.com/jxmot/tessel-networking-example/blob/master/aphttp.md)

# Tessel 2 API Overview

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


tessel.network.ap.on('setchannel', (result) => {
    console.log('AP channel = '+result);
    console.log('creating AP now...\n');
    // create the AP, handle with an event
    tessel.network.ap.create(apconfig);
});
```

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

