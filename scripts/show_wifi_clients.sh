#!/bin/sh

# Originally obtained from : 
# https://openwrt.org/docs/guide-user/network/wifi/faq.wireless
#
# Modified By :
# https://github.com/jxmot
#
# Used for a Tessel 2 project :
# https://github.com/jxmot/tessel-networking-example
#
# Usage :
#
#  Create a table of stations :
#   ./show_wifi_clients.sh
#
#
#  Create a JSON string for each station
#   ./show_wifi_clients.sh json
#
#
jsonout=0
if [ "$1" = "json" ]; then
  jsonout=1
fi

# Shows MAC, IP address and any hostname info for all connected wifi devices
# written for openwrt 12.09 Attitude Adjustment
if [ $jsonout -eq 0 ]; then
  echo    "# All connected wifi devices, with IP address,"
  echo    "# hostname (if available), and MAC address."
  echo -e "# IP address\tname\tMAC address"
else
  echo "["
fi

mcount=0

# list all wireless network interfaces 
# (for MAC80211 driver; see wiki article for alternative commands)
for interface in `iw dev | grep Interface | cut -f 2 -s -d" "`
do
  # for each interface, get mac addresses of connected stations/clients
  maclist=`iw dev $interface station dump | grep Station | cut -f 2 -s -d" "`

  mcount=$(echo "$maclist" | wc -w)

  # for each mac address in that list...
  for mac in $maclist
  do
    # If a DHCP lease has been given out by dnsmasq,
    # save it.
    ip="UNKN"
    host=""
    ip=`cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep $mac | cut -f 2 -s -d" "`
    host=`cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep $mac | cut -f 3 -s -d" "`
    # ... show the mac address:
    if [ $jsonout -eq 0 ]; then
      echo -e "$ip\t$host\t$mac"
    else
      tstamp=`cat /tmp/dhcp.leases | grep $mac | cut -f 1 -s -d" "`
      #echo "{\"tstamp\":$tstamp,\"ip\":\"$ip\",\"host\":\"$host\",\"mac\":\"$mac\"}"
      lineout="{\"tstamp\":$tstamp,\"ip\":\"$ip\",\"host\":\"$host\",\"mac\":\"$mac\"}"
      #$((mcount--))
      mcount=$((mcount - 1))
      if [ $mcount -gt 0 ]; then
        echo "$lineout,"
      else
        echo "$lineout"
      fi
    fi
  done
done

if [ $jsonout -eq 1 ]; then
  echo "]"
fi
