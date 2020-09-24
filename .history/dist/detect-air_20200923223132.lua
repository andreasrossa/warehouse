--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local component = require("component")
local serialization = require("serialization")
local geolyzer = component.geolyzer
local parsedArgs = {...}
local offsetX = tonumber(parsedArgs[1]) or 0
local offsetY = tonumber(parsedArgs[2]) or 0
local offsetZ = tonumber(parsedArgs[3]) or 0
local sizeX = tonumber(parsedArgs[4]) or 0
local sizeY = tonumber(parsedArgs[5]) or 0
local sizeZ = tonumber(parsedArgs[6]) or 0
local scanData = geolyzer.scan(offsetX, offsetY, offsetZ, sizeX, sizeY, sizeZ)
local i = 0
local map = {}
do
    local y = 0
    while y < (sizeY - 1) do
        print(
            "Y: " .. tostring(y)
        )
        do
            local z = 0
            while z < (sizeZ) do
                print(
                    "Z: " .. tostring(z)
                )
                do
                    local x = 0
                    while x < (sizeX - 1) do
                        print(
                            "X: " .. tostring(x)
                        )
                        map[i] = {posX = x, posY = y, posZ = z, hardness = scanData[i]}
                        i = i + 1
                        x = x + 1
                    end
                end
                z = z + 1
            end
        end
        y = y + 1
    end
end
print(
    serialization.serialize(map, true)
)
return ____exports
