// jxmot - this file is only meant to demonstrate that
// it's possible to turn the ports(A & B) off.

'use strict';

// Import the interface to Tessel hardware
const tessel = require('tessel');

// jxmot - turn off ports A and B, not in use so turn off
// the LEDs
tessel.close();

// Turn one of user the LEDs on to start.
tessel.led[2].on();

// Blink! This will alternate between the 2 user 
// LEDs (green and blue).
setInterval(() => {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 500);

console.log("I'm blinking! (Press CTRL + C to stop)");

process.on('SIGINT', () => {
    console.log('\nCaught interrupt signal, exiting...\n');
    tessel.led[2].off();
    tessel.led[3].off();
    process.exit();
});
