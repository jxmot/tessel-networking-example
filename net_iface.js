
var os = require( 'os' );
var netif = os.networkInterfaces();
console.log(JSON.stringify(netif, null, 4));
process.exit();

