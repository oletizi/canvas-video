import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md";
import React from "react";
import {Button, ButtonGroup} from "@mui/material";

export function TransportView({model}: { model: Transport }) {
    return (
        <ButtonGroup size="large">
            <Button onClick={() => model.reset()}><MdOutlineSkipPrevious size="1.25rem"/></Button>
            <Button onClick={() => model.start()}><MdOutlinePlayArrow size="1.25rem"/></Button>
            <Button onClick={() => model.stop()}><MdOutlineStop size="1.25rem"/></Button>
        </ButtonGroup>
    )
}

export interface TransportListener {
    started()

    stopped()

    reset()

    ticked()

    position(p: number)
}

export interface Transport {

    addListener(l: TransportListener)

    start()

    stop()

    reset()

    tick()

    isRunning(): boolean

    getPosition(): number
}

export function newTransport(): Transport {
    return new BasicTransport()
}

class BasicTransport implements Transport {
    private _isRunning: boolean = false
    private _position: number = 0
    private _listeners: TransportListener[] = []

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
        this._listeners.forEach(l => l.reset())
    }

    start() {
        this._isRunning = true
        this._listeners.forEach(l => l.started())
    }

    stop() {
        this._isRunning = false
        this._listeners.forEach(l => l.stopped())
    }

    tick() {
        if (this.isRunning()) {
            this._position++
            this._listeners.forEach(l => l.ticked())
        }
    }

    addListener(l: TransportListener) {
        this._listeners.push(l)
    }
}