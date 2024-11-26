import {Group} from "@chakra-ui/react";
import {Button} from "@/components/chakra/button";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md";
import React from "react";

export function Transport({model}: { model: TransportModel }) {
    return (<Group attached>
        <Button onClick={() => model.reset()}><MdOutlineSkipPrevious/></Button>
        <Button onClick={() => model.start()}><MdOutlinePlayArrow/></Button>
        <Button onClick={() => model.stop()}><MdOutlineStop/></Button>
    </Group>)
}

export interface TransportModel {
    start()

    stop()

    reset()

    tick()

    isRunning(): boolean

    getPosition(): number
}

export function newTransportModel(): TransportModel {
    return new BasicTransport()
}

class BasicTransport implements TransportModel {
    private _isRunning: boolean = false
    private _position: number = 0

    constructor() {
    }

    isRunning(): boolean {
        return this._isRunning;
    }

    getPosition(): number {
        return this._position
    }

    reset() {
        this._position = 0
    }

    start() {
        this._isRunning = true
    }

    stop() {
        this._isRunning = false
    }

    tick() {
        if (this.isRunning()) {
            this._position++
        }
    }
}