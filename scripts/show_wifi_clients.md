# Tessel 2 & OpenWRT - Show AP WiFi Clients

The `show_wifi_clients.sh` shell script found here is a modified version of what I found at the [OpenWRT Wireless FAQ](https://openwrt.org/docs/guide-user/network/wifi/faq.wireless).

My intent is to use it on a [Tessel 2](https://tessel.io/) along with a modification to its firmware. The firmware modification will `exec` the script to obtain a JSON formatted list of stations that are attached to the Tessel's *access point*.

The differences are - 
* Can optionally create output in JSON
    * Includes the time stamp found in the DHCP lease file 
* Minor changes made to expressions


**Default Ouput Example -**

```
> ./show_wifi_clients.sh
# All connected wifi devices, with IP address,
# hostname (if available), and MAC address.
# IP address    name    MAC address
192.168.1.173   ESP_DDEEFF      aa:bb:cc:dd:ee:ff
192.168.1.158   android-2496ac597fe00412        00:11:22:33:44:55
```

**JSON Formatted Output Example -**

```
> ./show_wifi_clients.sh json
[
{"tstamp":1525747482,"ip":"192.168.1.173","host":"ESP_DDEEFF","mac":"aa:bb:cc:dd:ee:ff"},
{"tstamp":1525747710,"ip":"192.168.1.158","host":"android-2496ac597fe00412","mac":"00:11:22:33:44:55"}
]
```

# Tessel Firmware Modifications

The `tessel-export.js` file will **require modification** if you want to use the station scanning feature *within a Tessel application*. The file is located in `t2-firmware/node`. 

Use the following steps to modifiy it - <br>

1) Obtain a copy of the [`t2-firmware`](https://github.com/tessel/t2-firmware) repository and modify the `t2-firmware/node/tessel-export.js` file there.

2) Find the *Access Point class*, this can be done by searching `tessel-export.js` for `class AP extends EventEmitter {`.

3) Then add the following function to the *Access Point class* - 

```javascript
  stations(type, callback) {
    callback = enforceCallback(callback);
    cp.exec(`/usr/local/bin/show_wifi_clients.sh ${type}`, (error, result) => {
      if (error) {
        throw error;
      }
      emitAndCallback('stations', this, JSON.parse(result), callback);
    });
  }
```

## Installation & Use

Working Environment :
* Windows 10 64bit
* Using the Git Bash shell
* The target Tessel 2 has been provisioned and has been confirmed to be operational.

To install the `show_wifi_clients.sh` script and the firmware modification(*described above*) follow these steps - <br>

1) log into your Tessel 2 via SSH. See [jxmot/tessel-ssh-win](https://github.com/jxmot/tessel-ssh-win) for instructions when working in Windows.
2) Then create the folder path `/usr/local/bin` - <br>
    * `mkdir /usr/local`
    * `mkdir /usr/local/bin`
3) Copy `show_wifi_clients.sh` into `/usr/local/bin` -<br>
    * `scp -i ~/.tessel/id_rsa ./show_wifi_clients.sh root@YOUR_TESSEL:/usr/local/bin` 
4) Copy the modified `tessel-export.js` file to `t2-firmware/node`
    * `cd t2-firmware/node`
    * `scp -i ~/.tessel/id_rsa ./tessel-export.js root@YOUR_TESSEL:/usr/lib/node`

Where : **`YOUR_TESSEL`** is the *name* you've given to your Tessel 2. If the name isn't working the use that Tessel's IP address instead.

### Usage

After completing the steps above the *station scanner* can be used like this - 

```javascript
//  NOTE : This is the minimal code required - 

tessel.network.ap.on('stations', (result) => {
    console.log('stations = '+JSON.stringify(result));
});

tessel.network.ap.stations('json');
```

The output to the console will appear something like this - <br>

```
stations = [{"tstamp":1525770745,"ip":"192.168.1.173","host":"ESP_49E3C5","mac":"2c:3a:e8:49:e3:c5"}]
stations = [{"tstamp":1525770745,"ip":"192.168.1.173","host":"ESP_49E3C5","mac":"2c:3a:e8:49:e3:c5"},{"tstamp":1525770834,"ip":"192.168.1.158","host":"android-72d96d29a805b447","mac":"10:0a:23:e1:ab:3c"}]
```

To see a working *example* of the scanner and the programmatic initialization of a Tessel access point please see [jxmot/tessel-networking-example](https://github.com/jxmot/tessel-networking-example). That repository contains the modified `tessel-export.js` file and the `tessel-ap-test.js` application.

