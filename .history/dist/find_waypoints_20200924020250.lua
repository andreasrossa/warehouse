--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
require("lualib_bundle");
local ____exports = {}
local component = require("component")
local serialization = require("serialization")
local parsedArgs = {...}
local a = parsedArgs[1]
local b = parsedArgs[2]
local range = tonumber(parsedArgs[3]) or 1000
local function toGlobalPos(self, offset, globalPos)
    local newPos = {}
    do
        local i = 0
        while i < 3 do
            newPos[i + 1] = globalPos[i + 1] + offset[i + 1]
            i = i + 1
        end
    end
    return newPos
end
local nav = component.navigation
local pos = {
    nav:getPosition()
}
local waypoints = nav.findWaypoints(range)
local wA = __TS__ArrayFind(
    waypoints,
    function(____, e) return e.label == a end
)
local wB = __TS__ArrayFind(
    waypoints,
    function(____, e) return e.label == b end
)
if wA == nil then
    error(
        tostring(a) .. " could not be found"
    )
end
if wB == nil then
    error(
        tostring(b) .. " could not be found"
    )
end
local r = {
    bottomLeft = toGlobalPos(nil, wA.position, pos),
    topRight = toGlobalPos(nil, wB.position, pos),
    bottomRight = toGlobalPos(nil, {wB.position[1], wB.position[2], wA.position[3]}, pos),
    topLeft = toGlobalPos(nil, {wA.position[1], wA.position[2], wB.position[3]}, pos)
}

print
print(
    serialization.serialize(r, true)
)
return ____exports
