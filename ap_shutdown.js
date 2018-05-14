'use strict';
const tessel = require('tessel');
// turn off ports A and B, not in use so we'll turn off the LEDs
tessel.close();
// disable the access point...
tessel.network.ap.disable( () => {
    console.log('AP disabled\n');
    // turn the LEDs OFF as a indicator of success
    tessel.led[2].off();
    tessel.led[3].off();
    setTimeout(process.exit, 1500);
});

