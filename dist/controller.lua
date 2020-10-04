--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local robot
function ____exports.moveForward(self)
    print("Moving Forward")
    local mvt = {
        robot.forward()
    }
    if not mvt[1] then
        error(mvt[2], 0)
    end
end
robot = require("robot")
local sides = require("sides")
____exports.FacingDir = {}
____exports.FacingDir.North = 0
____exports.FacingDir[____exports.FacingDir.North] = "North"
____exports.FacingDir.East = 90
____exports.FacingDir[____exports.FacingDir.East] = "East"
____exports.FacingDir.South = 180
____exports.FacingDir[____exports.FacingDir.South] = "South"
____exports.FacingDir.West = 270
____exports.FacingDir[____exports.FacingDir.West] = "West"
function ____exports.currentFacingDir(self, nav)
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
function ____exports.faceDirection(self, dir, nav)
    print(
        "Facing: " .. tostring(
            tostring(dir)
        )
    )
    local facing = ____exports.currentFacingDir(nil, nav)
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
function ____exports.moveInDirection(self, dir, dist, nav)
    ____exports.faceDirection(nil, dir, nav)
    do
        local i = 0
        while i < math.abs(dist) do
            ____exports.moveForward(nil)
            i = i + 1
        end
    end
end
function ____exports.moveX(self, dist, nav)
    if dist < 0 then
        ____exports.moveInDirection(nil, ____exports.FacingDir.East, dist, nav)
    else
        ____exports.moveInDirection(nil, ____exports.FacingDir.West, dist, nav)
    end
end
function ____exports.moveZ(self, dist, nav)
    if dist < 0 then
        ____exports.moveInDirection(nil, ____exports.FacingDir.South, dist, nav)
    else
        ____exports.moveInDirection(nil, ____exports.FacingDir.North, dist, nav)
    end
end
function ____exports.moveFromTo(self, from, to, nav)
    print(
        ((((((("Moving: (" .. tostring(from.x)) .. ", ") .. tostring(from.z)) .. ") -> (") .. tostring(to.x)) .. ", ") .. tostring(to.z)) .. ")"
    )
    if from.z == to.z then
        local dist = to.x - from.x
        print(
            "dist = " .. tostring(dist)
        )
        ____exports.moveZ(nil, dist, nav)
    elseif from.x == to.x then
        local dist = to.z - from.z
        print(
            "dist = " .. tostring(dist)
        )
        ____exports.moveX(nil, dist, nav)
    else
        error("Tried to move diagonally")
    end
end
function ____exports.walkPath(self, path, nodeGraph, nav)
    print(
        "Walking Path with size " .. tostring(#path)
    )
    do
        local i = 0
        while i < (#path - 1) do
            local from = nodeGraph:get(path[i + 1])
            local to = nodeGraph:get(path[(i + 1) + 1])
            if (from == nil) or (to == nil) then
                error("From or to was null")
            end
            do
                local ____try, ____error = pcall(
                    function()
                        ____exports.moveFromTo(nil, from.pos, to.pos, nav)
                    end
                )
                if not ____try then
                    print(____error)
                end
            end
            os.sleep(0.5)
            i = i + 1
        end
    end
end
return ____exports
