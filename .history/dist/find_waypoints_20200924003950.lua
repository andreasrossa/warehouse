--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local component = require("component")
local nav = component.navigation
local x, y, z = unpack(
    nav:getPosition()
)
print(
    (((("X: " .. tostring(x)) .. ", Y: ") .. tostring(y)) .. ", Z: ") .. tostring(z)
)
return ____exports
