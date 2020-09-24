--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
require("lualib_bundle");
local ____exports = {}
local component = require("component")
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
    while y < sizeY do
        do
            local z = 0
            while z < sizeZ do
                do
                    local x = 0
                    while x < sizeX do
                        map[y][z][x] = scanData[i]
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
do
    local z = 0
    while z < #map[1] do
        local row = map[1][z + 1]
        print(
            table.concat(
                __TS__ArrayMap(
                    row,
                    function(____, it) return ((it > 0) and 1) or 0 end
                ),
                " " or ","
            )
        )
        z = z + 1
    end
end
return ____exports
