--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
require("lualib_bundle");
local ____exports = {}
local term = require("term")
function ____exports.toGlobalPos(self, offset, globalPos)
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
____exports.width = function(____, r) return math.abs(r.bottomRight[1] - r.bottomLeft[1]) + 1 end
____exports.length = function(____, r) return math.abs(r.topRight[3] - r.bottomRight[3]) + 1 end
____exports.getPos = function(____, nav) return {
    nav.getPosition()
} end
function ____exports.getWaypoints(self, waypointLabels, nav, waypointRange)
    if waypointRange == nil then
        waypointRange = 100
    end
    local waypointsInRange = nav.findWaypoints(waypointRange)
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
                    ((("\"" .. tostring(waypointLabels[i + 1])) .. "\" could not be found within ") .. tostring(waypointRange)) .. " blocks"
                )
            end
            matchingWaypoints[waypointLabels[i + 1]] = matched
            i = i + 1
        end
    end
    return matchingWaypoints
end
function ____exports.getRectangle(self, wA, wB, pos)
    return {
        bottomRight = ____exports.toGlobalPos(nil, wA.position, pos),
        topLeft = ____exports.toGlobalPos(nil, wB.position, pos),
        bottomLeft = ____exports.toGlobalPos(nil, {wB.position[1], wB.position[2], wA.position[3]}, pos),
        topRight = ____exports.toGlobalPos(nil, {wA.position[1], wA.position[2], wB.position[3]}, pos)
    }
end
function ____exports.scanTo3DMatrix(self, sizeX, sizeY, sizeZ, scanData)
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
function ____exports.print3DMatrix(self, matrix, gpu)
    term.clear()
    local cursorOffset = {7, 7}
    do
        local y = 0
        while y < #matrix do
            do
                local z = 0
                while z < #matrix[y + 1] do
                    gpu.set(
                        5,
                        z + cursorOffset[2],
                        tostring(z)
                    )
                    do
                        local x = #matrix[y + 1][z + 1] - 1
                        while x >= 0 do
                            gpu.set(x + cursorOffset[1], z + cursorOffset[2], ((matrix[y + 1][z + 1][x + 1] > 0) and "O") or " ")
                            x = x - 1
                        end
                    end
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
function ____exports.printNodeGraph(self, graph)
end
function ____exports.correctXZ(self, matrix)
    local newMatrix = __TS__ObjectAssign(matrix)
    do
        local y = 0
        while y < #matrix do
            newMatrix[y] = __TS__ArrayReverse(matrix[y + 1])
            do
                local z = 0
                while z < #matrix[y + 1] do
                    newMatrix[y][z] = __TS__ArrayReverse(matrix[y + 1][z + 1])
                    z = z + 1
                end
            end
            y = y + 1
        end
    end
    return newMatrix
end
function ____exports.scanRectangle(self, r, nav, geo)
    local pos = ____exports.getPos(nil, nav)
    local rW = ____exports.width(nil, r)
    local rL = ____exports.length(nil, r)
    local a = r.bottomRight
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
        error(
            (((((((("Scan unsuccessful - w:" .. tostring(rW)) .. " l:") .. tostring(rL)) .. " - ") .. tostring(relativeOrigin[1])) .. ", ") .. tostring(relativeOrigin[2])) .. ", ") .. tostring(relativeOrigin[3])
        )
    end
    return ____exports.scanTo3DMatrix(nil, rW, 1, rL, scanData)[1]
end
function ____exports.printWaypointArea(self, waypointA, waypointB, waypointRange, nav, geo, gpu)
    if waypointRange == nil then
        waypointRange = 100
    end
    local waypoints = ____exports.getWaypoints(nil, {waypointA, waypointB}, nav, waypointRange)
    local r = ____exports.getRectangle(
        nil,
        waypoints[waypointA],
        waypoints[waypointB],
        {
            nav.getPosition()
        }
    )
    local matrix = ____exports.scanRectangle(nil, r, nav, geo)
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
    if matrix == nil then
        return
    end
    ____exports.print3DMatrix(nil, {matrix}, gpu)
end
function ____exports.comparePos(self, a, b)
    return (a.x == b.x) and (a.z == b.z)
end
function ____exports.getNeighbours(self, currentPos, graph)
    return __TS__ArrayMap(
        __TS__ArrayFilter(
            {
                __TS__Spread(graph)
            },
            function(____, ____bindingPattern0)
                local id = ____bindingPattern0[1]
                local pos = ____bindingPattern0[2]
                return ((____exports.comparePos(nil, {x = currentPos.x, z = currentPos.z - 1}, pos) or ____exports.comparePos(nil, {x = currentPos.x, z = currentPos.z + 1}, pos)) or ____exports.comparePos(nil, {x = currentPos.x - 1, z = currentPos.z}, pos)) or ____exports.comparePos(nil, {x = currentPos.x + 1, z = currentPos.z}, pos)
            end
        ),
        function(____, ____bindingPattern0)
            local id = ____bindingPattern0[1]
            local pos = ____bindingPattern0[2]
            return id
        end
    )
end
function ____exports.findAirPositions(self, matrix)
    local nodePositions = __TS__New(Map)
    local i = 0
    do
        local z = 0
        while z < #matrix do
            do
                local x = 0
                while x < #matrix[z + 1] do
                    do
                        local tile = matrix[z + 1][x + 1]
                        if tile ~= 0 then
                            goto __continue38
                        end
                        nodePositions:set(i, {x = x, z = z})
                        i = i + 1
                    end
                    ::__continue38::
                    x = x + 1
                end
            end
            z = z + 1
        end
    end
    return nodePositions
end
function ____exports.nodeGraphFromPositions(self, nodePositions)
    local graph = __TS__New(Map)
    do
        local i = 0
        while i < nodePositions.size do
            do
                local pos = nodePositions:get(i)
                local neighbours = ____exports.getNeighbours(nil, pos, nodePositions)
                if #neighbours == 0 then
                    goto __continue41
                end
                graph:set(i, {neighbours = neighbours, pos = pos})
            end
            ::__continue41::
            i = i + 1
        end
    end
    return graph
end
function ____exports.reduceGraph(self, graph)
    local reduced = __TS__New(Map, graph)
    print(
        "Non-Reduced size: " .. tostring(reduced.size)
    )
    return
end
function ____exports.manhattanDistance(self, a, b)
    return math.abs(a.x - b.x) + math.abs(a.z - b.z)
end
function ____exports.cost(self, a, b, graph)
    return ____exports.manhattanDistance(
        nil,
        graph:get(a).pos,
        graph:get(b).pos
    )
end
function ____exports.russianMan(self, start, ____end, graph)
    local finished = __TS__New(Set)
    local costs = __TS__New(Map)
    local paths = __TS__New(Map)
    costs:set(start, 0)
    paths:set(start, {start})
    while true do
        local cheapestCost = math.min(
            table.unpack(
                __TS__ArrayMap(
                    __TS__ArrayFilter(
                        {
                            __TS__Spread(costs)
                        },
                        function(____, ____bindingPattern0)
                            local id = ____bindingPattern0[1]
                            local n = ____bindingPattern0[2]
                            return not finished:has(id)
                        end
                    ),
                    function(____, ____bindingPattern0)
                        local id = ____bindingPattern0[1]
                        local c = ____bindingPattern0[2]
                        return c
                    end
                )
            )
        )
        if cheapestCost == nil then
            break
        end
        local current = __TS__ArrayFind(
            {
                __TS__Spread(costs)
            },
            function(____, ____bindingPattern0)
                local id = ____bindingPattern0[1]
                local c = ____bindingPattern0[2]
                return c == cheapestCost
            end
        )[1]
        if current == ____end then
            return paths:get(____end)
        end
        local n = graph:get(current).neighbours
        if (n == nil) or (#n == 0) then
            error("Seperate Nodes")
        end
        __TS__ArrayForEach(
            n,
            function(____, id)
                local edgeCost = ____exports.cost(nil, current, id, graph)
                local newCost = edgeCost + costs:get(current)
                local oldCost = costs:get(id)
                local newPath = {
                    table.unpack(
                        __TS__ArrayConcat(
                            {
                                table.unpack(
                                    paths:get(current)
                                )
                            },
                            {id}
                        )
                    )
                }
                if oldCost == nil then
                    costs:set(id, newCost)
                    paths:set(id, newPath)
                else
                    if newCost < oldCost then
                        costs:set(id, newCost)
                        paths:set(id, newPath)
                    end
                end
            end
        )
        finished:add(current)
    end
    return nil
end
return ____exports
