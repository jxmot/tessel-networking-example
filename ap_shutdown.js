'use strict';

// Import the interface to Tessel hardware
const tessel = require('tessel');

tessel.network.ap.disable( () => {
    console.log('AP disabled\n');
    // turn the LEDs OFF as a indicator of success
    tessel.led[2].off();
    tessel.led[3].off();
    setTimeout(process.exit, 1500);
});

