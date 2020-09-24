import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const args = [...args]

const nav = component.navigation

const pos = [...nav.getPosition()]

const waypoints = nav.findWaypoints(1000);

waypoints.forEach(w => {
    
})
