--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local robot = require("robot")
local degrees = tonumber(({...})[1]) or 0
if (degrees % 90) ~= 0 then
    error("Must be in 90° steps", 0)
end
do
    local i = 0
    while i < (degrees / 90) do
        robot.turnRight()
        i = i + 1
    end
end
return ____exports
