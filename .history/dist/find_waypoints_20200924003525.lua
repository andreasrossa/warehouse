--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local component = require("component")
local serialization = require("serialization")
local nav = component.navigation
print(
    serialization.serialize(
        nav:getPosition(),
        true
    )
)
return ____exports
