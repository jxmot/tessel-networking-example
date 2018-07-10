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

