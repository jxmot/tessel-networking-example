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
#  Create an array of JSON strings. One element for each station
#   ./show_wifi_clients.sh json
#
#

# look for the "json" argument, and enable JSON output 
# if present.
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
  # output format is JSON, start an array
  echo "["
fi

# list all wireless network interfaces 
# (for MAC80211 driver; see wiki article for alternative commands)
for interface in $(iw dev | grep Interface | cut -f 2 -s -d" ")
do
  # for each interface, get mac addresses of connected stations/clients
  maclist=$(iw dev $interface station dump | grep Station | cut -f 2 -s -d" ")

  # count the MACs that were found
  mcount=$(echo "$maclist" | wc -w)

  # for each mac address in that list...
  for mac in $maclist
  do
    # If a DHCP lease has been given out by dnsmasq,
    # save it.
    ip=""
    host=""
    ip=$(cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep $mac | cut -f 2 -s -d" ")
    host=$(cat /tmp/dhcp.leases | cut -f 2,3,4 -s -d" " | grep $mac | cut -f 3 -s -d" ")
    # ... show the mac address:
    if [ $jsonout -eq 0 ]; then
      echo -e "$ip\t$host\t$mac"
    else
      # output data as JSON
      tstamp=$(cat /tmp/dhcp.leases | grep $mac | cut -f 1 -s -d" ")
# MUST check fields (tstamp, host) for "" and do not output if true
      echo -n "{\"tstamp\":$tstamp,\"ip\":\"$ip\",\"host\":\"$host\",\"mac\":\"$mac\"}"
      # decrement the count, if > 0 then append a comma
      mcount=$((mcount - 1))
      if [ $mcount -gt 0 ]; then
        echo ","
      else
        echo ""
      fi
    fi
  done
done

# close the JSON array
if [ $jsonout -eq 1 ]; then
  echo "]"
fi
