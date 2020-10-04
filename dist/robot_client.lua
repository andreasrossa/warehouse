--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local event = require("event")
local serialization = require("serialization")
local component = require("component")
local nav = component.navigation
local modem = component.modem
modem.open(11)
while true do
    local e = {
        event.pull("modem_message")
    }
    local msg = serialization.unserialize(e[5])
end
return ____exports
