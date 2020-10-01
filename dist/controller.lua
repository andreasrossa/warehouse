--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local robot, sides
function ____exports.moveForward(self)
    print("Moving Forward")
    if robot:move(sides.front) then
        return
    end
end
robot = require("robot")
local component = require("component")
sides = require("sides")
local nav = component.navigation
____exports.FacingDir = {}
____exports.FacingDir.North = 0
____exports.FacingDir[____exports.FacingDir.North] = "North"
____exports.FacingDir.East = 90
____exports.FacingDir[____exports.FacingDir.East] = "East"
____exports.FacingDir.South = 180
____exports.FacingDir[____exports.FacingDir.South] = "South"
____exports.FacingDir.West = 270
____exports.FacingDir[____exports.FacingDir.West] = "West"
function ____exports.currentFacingDir(self)
    local facing = nav:getFacing()
    local ____switch3 = facing
    if ____switch3 == sides.front then
        goto ____switch3_case_0
    elseif ____switch3 == sides.right then
        goto ____switch3_case_1
    elseif ____switch3 == sides.left then
        goto ____switch3_case_2
    elseif ____switch3 == sides.back then
        goto ____switch3_case_3
    end
    goto ____switch3_end
    ::____switch3_case_0::
    do
        return ____exports.FacingDir.North
    end
    ::____switch3_case_1::
    do
        return ____exports.FacingDir.East
    end
    ::____switch3_case_2::
    do
        return ____exports.FacingDir.West
    end
    ::____switch3_case_3::
    do
        return ____exports.FacingDir.South
    end
    ::____switch3_end::
    return -1
end
function ____exports.faceDirection(self, dir)
    print(
        "Facing: " .. tostring(
            tostring(dir)
        )
    )
    local facing = ____exports.currentFacingDir(nil)
    local rotation = dir - facing
    if rotation < 0 then
        do
            local i = 0
            while i <= math.abs(rotation) do
                robot.turnLeft()
                i = i + 90
            end
        end
    else
        do
            local i = 0
            while i <= math.abs(rotation) do
                robot.turnRight()
                i = i + 90
            end
        end
    end
end
function ____exports.moveInDirection(self, dir, dist)
    ____exports.faceDirection(nil, dir)
    do
        local i = 0
        while i < math.abs(dist) do
            ____exports.moveForward(nil)
            i = i + 1
        end
    end
end
function ____exports.moveX(self, dist)
    if dist < 0 then
        ____exports.moveInDirection(nil, ____exports.FacingDir.East, dist)
    else
        ____exports.moveInDirection(nil, ____exports.FacingDir.West, dist)
    end
end
function ____exports.moveZ(self, dist)
    if dist < 0 then
        ____exports.moveInDirection(nil, ____exports.FacingDir.South, dist)
    else
        ____exports.moveInDirection(nil, ____exports.FacingDir.North, dist)
    end
end
function ____exports.moveFromTo(self, from, to, nodeGraph)
    if from.x == to.x then
        ____exports.moveX(nil, to.x - from.x)
    elseif from.z == to.z then
        ____exports.moveZ(nil, to.z - from.z)
    else
        error("Tried to move diagonally")
    end
end
function ____exports.walkPath(self, path, nodeGraph)
    print(
        "Walking Path with size " .. tostring(#path)
    )
    do
        local i = 0
        while i < (#path - 1) do
            local from = nodeGraph:get(path[i + 1])
            local to = nodeGraph:get(path[(i + 1) + 1])
            ____exports.moveFromTo(nil, from.pos, to.pos, nodeGraph)
            i = i + 1
        end
    end
end
return ____exports
