import * as robot from "robot"

/**
 * @noSelf
 * @noResolution
 */
declare module "robot" {
    /**
     * @tupleReturn
     * @param side 
     */
    function move(side: number): [boolean, string]
}