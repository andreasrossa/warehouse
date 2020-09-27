--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
require("lualib_bundle");
local ____exports = {}
local component = require("component")
local parsedArgs = {...}
local aLabel = parsedArgs[1]
local bLabel = parsedArgs[2]
local range = tonumber(parsedArgs[3]) or 1000
local nav = component.navigation
local geo = component.geolyzer
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
local width
width = function(____, r) return math.abs(r.bottomRight[1] - r.bottomLeft[1]) + 1 end
local length
length = function(____, r) return math.abs(r.topRight[3] - r.bottomRight[3]) + 1 end
local getPos
getPos = function(____, nav) return {
    nav.getPosition()
} end
local function getWaypoints(self, waypointLabels, nav)
    local waypointsInRange = nav.findWaypoints(range)
    local matchingWaypoints = {}
    do
        local i = 0
        while i < #waypointLabels do
            local matched = __TS__ArrayFind(
                waypointsInRange,
                function(____, e) return e.label == waypointLabels[i + 1] end
            )
            if matched == nil then
                error(
                    ((("\"" .. tostring(waypointLabels[i + 1])) .. "\" could not be found within ") .. tostring(range)) .. " blocks"
                )
            end
            matchingWaypoints[waypointLabels[i + 1]] = matched
            i = i + 1
        end
    end
    return matchingWaypoints
end
local function getRectangle(self, wA, wB, pos)
    return {
        bottomLeft = toGlobalPos(nil, wA.position, pos),
        topRight = toGlobalPos(nil, wB.position, pos),
        bottomRight = toGlobalPos(nil, {wB.position[1], wB.position[2], wA.position[3]}, pos),
        topLeft = toGlobalPos(nil, {wA.position[1], wA.position[2], wB.position[3]}, pos)
    }
end
local function scanTo3DMatrix(self, sizeX, sizeY, sizeZ, scanData)
    local matrix = {}
    local i = 0
    do
        local y = 0
        while y < sizeY do
            matrix[y + 1] = {}
            do
                local z = 0
                while z < sizeZ do
                    matrix[y + 1][z + 1] = {}
                    do
                        local x = 0
                        while x < sizeX do
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
                    "_",
                    math.floor(#matrix[1][2])
                )
            )
            y = y + 1
        end
    end
end
local function scanRectangle(self, r, nav, geo)
    local pos = getPos(nil, nav)
    local rW = width(nil, r)
    local rL = length(nil, r)
    local a = r.bottomLeft
    if (rW * rL) > 64 then
        error("Maximum volume is 64 blocks (for now)")
    end
    if pos[2] ~= a[2] then
        error("Robot and rectangle not on the same y")
    end
    local relativeOrigin = {a[1] - pos[1], 0, a[3] - pos[3]}
    print(
        (((((((("Scanning: w=" .. tostring(rW)) .. " l=") .. tostring(rL)) .. " - x=") .. tostring(relativeOrigin[1])) .. ", y=") .. tostring(relativeOrigin[2])) .. ", z=") .. tostring(relativeOrigin[3])
    )
    local scanData = nil
    do
        local ____try, e = pcall(
            function()
                scanData = geo.scan(relativeOrigin[1], relativeOrigin[3], relativeOrigin[2], rW, rL, 1)
            end
        )
        if not ____try then
            print(e)
        end
    end
    if scanData == nil then
        print(
            (((((((("Scan unsuccessful - w:" .. tostring(rW)) .. " l:") .. tostring(rL)) .. " - ") .. tostring(relativeOrigin[1])) .. ", ") .. tostring(relativeOrigin[2])) .. ", ") .. tostring(relativeOrigin[3])
        )
        return nil
    end
    return scanTo3DMatrix(nil, rW, 1, rL, scanData)
end
local function scanWaypointArea(self, waypointA, waypointB, nav, geo)
    local waypoints = getWaypoints(nil, {waypointA, waypointB}, nav)
    local r = getRectangle(
        nil,
        waypoints[waypointA],
        waypoints[waypointB],
        {
            nav.getPosition()
        }
    )
    print(
        (((((("Rectangle: bl=" .. tostring(
            table.concat(r.bottomLeft, "," or ",")
        )) .. " br=") .. tostring(
            table.concat(r.bottomRight, "," or ",")
        )) .. " tl=") .. tostring(
            table.concat(r.topLeft, "," or ",")
        )) .. " tr=") .. tostring(
            table.concat(r.topRight, "," or ",")
        )
    )
    local matrix = scanRectangle(nil, r, nav, geo)
    if matrix == nil then
        return
    end
    print3DMatrix(nil, matrix)
end
scanWaypointArea(nil, aLabel, bLabel, nav, geo)
return ____exports
