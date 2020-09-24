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
local rawScanData = geolyzer.scan(offsetX, offsetZ, offsetY, sizeX, sizeZ, sizeY)
local scanData = __TS__ArraySlice(rawScanData, 0, (sizeX * sizeY) * sizeZ)
local function scanTo3DMatrix(self, sizeX, sizeY, sizeZ, scanData)
    local matrix = {}
    local i = 0
    do
        local y = 0
        while y < sizeY do
            print(
                "Y: " .. tostring(y)
            )
            matrix[y + 1] = {}
            do
                local z = 0
                while z < sizeZ do
                    print(
                        "Z: " .. tostring(z)
                    )
                    matrix[y + 1][z + 1] = {}
                    do
                        local x = 0
                        while x < sizeX do
                            print(
                                "X: " .. tostring(x)
                            )
                            matrix[y + 1][z + 1][x + 1] = scanData[i + 1]
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
    return matrix
end
local function print3DMatrix(self, matrix)
    do
        local y = 0
        while y < #matrix do
            do
                local z = 0
                while z < #matrix[1] do
                    print(
                        table.concat(
                            __TS__ArrayMap(
                                matrix[1][z + 1],
                                function(____, e) return ((e > 0) and 1) or 0 end
                            ),
                            " " or ","
                        )
                    )
                    z = z + 1
                end
            end
            print(
                string.rep(
                    "-",
                    math.floor(sizeX)
                )
            )
            y = y + 1
        end
    end
end
local matrix = scanTo3DMatrix(nil, sizeX, sizeY, sizeZ, scanData)
print3DMatrix(nil, matrix)
return ____exports
