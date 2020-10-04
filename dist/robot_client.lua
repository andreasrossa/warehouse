--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local event = require("event")
local serialization = require("serialization")
local component = require("component")
local wh = require("warehouse_lib")
local controller = require("controller")
local nav = component.navigation
local modem = component.modem
modem.open(11)
while true do
    do
        local e = {
            event.pull("modem_message")
        }
        local msg = serialization.unserialize(e[6])
        local pos = wh:getPos(nav)
        local moveTo = msg.moveTo
        if not wh:positionsAlign(pos, moveTo) then
            print(
                ((("Positions do not align (x: " .. tostring(pos.x)) .. ", z: ") .. tostring(pos.z)) .. ")! Ignoring..."
            )
            goto __continue2
        end
        do
            local ____try, e = pcall(
                function()
                    controller:moveFromTo(pos, moveTo, nav)
                end
            )
            if not ____try then
                print(e[0])
            end
        end
    end
    ::__continue2::
end
return ____exports
