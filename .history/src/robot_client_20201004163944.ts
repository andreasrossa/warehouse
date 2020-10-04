import robot = require("robot");
import event = require("event");
import serialization = require("serialization")
import component = require("component");
import wh = require("./warehouse_lib");
import controller = require("./controller");

const nav = component.navigation
const modem = component.modem 

/**
 * Main Loop:
 *
 * 1. Robot receives signal to move to a specific position
 * 2. Robot checks if its current position aligns with the specified position
 * 3. Robot turns if necessary
 * 4. Robot moves the according number of blocks
*/

// Setup
modem.open(11)

// Main Loop
while (true) {
	const e = event.pull("modem_message")
	const msg = serialization.unserialize(e[4])
}