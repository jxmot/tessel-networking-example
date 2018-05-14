
var os = require( 'os' );
var netif = os.networkInterfaces();
console.log(JSON.stringify(netif, null, 4));
console.log('\n\n');

//var _netif = JSON.parse(JSON.stringify(netif));
//console.log(JSON.stringify(_netif, null, 4));
//console.log('\n\n');

// linux
var addr = getIPv4('eth0');
if(addr !== undefined) {
    console.log('eth0  = '+addr.ip+'  '+addr.mac);
}
addr = getIPv4('wlan0');
if(addr !== undefined) {
    console.log('wlan0  = '+addr.ip+'  '+addr.mac);
}

// windows
//var addr = getIPv4('Ethernet');
//if(addr !== undefined) {
//    console.log('Ethernet   = '+addr.ip+'  '+addr.mac);
//}
//addr = getIPv4('Ethernet 2');
//if(addr !== undefined) {
//    console.log('Ethernet 2 = '+addr.ip+'  '+addr.mac);
//}

process.exit();

function getIPv4(_iface) {
    var addrinfo = {
        ip: '',
        mac: ''
    };

    var iface = ((_iface.toLowerCase() === 'wlan0' || _iface.toLowerCase() === 'eth0') ? _iface.toLowerCase() : 'UNKNWN');
    if(iface !== 'UNKNWN') {
        var netif = os.networkInterfaces();
        if(netif[iface] !== undefined) {
            for(var ix = 0;ix < netif[iface].length;ix++) {
                if(netif[iface][ix]['family'] === 'IPv4') {
                    addrinfo.ip = netif[iface][ix]['address'];
                    addrinfo.mac = netif[iface][ix]['mac'];
                    break;
                }
            }
        } else addrinfo = undefined;
    } else addrinfo = undefined;
    return addrinfo;
};
