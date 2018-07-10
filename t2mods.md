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
