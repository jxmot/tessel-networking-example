# OpenWRT - Show AP WiFi Clients

The `show_wifi_clients.sh` shell script found here is a modified version of what I found at the [OpenWRT Wireless FAQ](https://openwrt.org/docs/guide-user/network/wifi/faq.wireless).

My intent is to use it on a [Tessel 2](https://tessel.io/) along with some modifications its firmware. The firmware mods (*not shown here*) will `exec` the script to obtain a JSON formatted list of stations that are attached to the Tessel's *access point*.

The differences are - 
* Can optionally create output in JSON
    * Includes the time stamp found in the DHCP lease file 
* Minor changes made to expressions

