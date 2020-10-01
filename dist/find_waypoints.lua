--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
require("lualib_bundle");
local ____exports = {}
local wl = require("warehouse_lib")
local component = require("component")
local controller = require("controller")
local parsedArgs = {...}
local aLabel = parsedArgs[1]
local bLabel = parsedArgs[2]
local start = tonumber(parsedArgs[3])
local ____end = tonumber(parsedArgs[4])
local range = tonumber(parsedArgs[5]) or 100
local nav = component.navigation
local geo = component.geolyzer
local waypoints = wl:getWaypoints({aLabel, bLabel}, nav, range)
local r = wl:getRectangle(
    waypoints[aLabel],
    waypoints[bLabel],
    {
        nav.getPosition()
    }
)
local matrix = wl:scanRectangle(r, nav, geo)
local nodePositions = wl:findAirPositions(matrix)
nodePositions:forEach(
    function(____, n, id) return print(
        ((((tostring(id) .. " (x: ") .. tostring(n.x)) .. ", z: ") .. tostring(n.z)) .. ")"
    ) end
)
local graph = wl:nodeGraphFromPositions(nodePositions)
print("Size before reduction:", graph.size)
graph = wl:reduceGraph(graph)
print("Size:", graph.size)
__TS__ArrayForEach(
    {
        __TS__Spread(graph)
    },
    function(____, ____bindingPattern0)
        local id = ____bindingPattern0[1]
        local it = ____bindingPattern0[2]
        return print(
            ((((((tostring(id) .. " (x: ") .. tostring(it.pos.x)) .. ", z: ") .. tostring(it.pos.z)) .. "): [") .. tostring(
                table.concat(it.neighbours, ", " or ",")
            )) .. "]"
        )
    end
)
local path = wl:russianMan(start, ____end, graph)
print(
    "Path:",
    table.concat(path, ", " or ",")
)
controller:walkPath(path, graph)
return ____exports
