import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args]

const a = parsedArgs[0]
const b = parsedArgs[1]

const nav = component.navigation

const pos = [...nav.getPosition()]

const waypoints = nav.findWaypoints(1000);

waypoints.forEach(w => {
    
})
