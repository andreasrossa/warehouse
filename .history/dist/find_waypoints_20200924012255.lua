--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local component = require("component")
local serialization = require("serialization")
local nav = component.navigation
local x, y, z = nav:getPosition()
print(
    serialization.serialize(
        nav:findWaypoints(1000)
    )
)
print(
    (((("X: " .. tostring(x)) .. ", Y: ") .. tostring(y)) .. ", Z: ") .. tostring(z)
)
return ____exports
