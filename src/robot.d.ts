import * as robot from "robot"

declare module "robot" {
    function move(side: number): boolean
}