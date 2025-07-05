import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md";
import React from "react";

export function TransportView({model}: { model: Transport }) {
    return (
        <div className="flex gap-1">
            <button 
                onClick={() => model.reset()}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100"
            >
                <MdOutlineSkipPrevious size="1.25rem"/>
            </button>
            <button 
                onClick={() => model.start()}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100"
            >
                <MdOutlinePlayArrow size="1.25rem"/>
            </button>
            <button 
                onClick={() => model.stop()}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100"
            >
                <MdOutlineStop size="1.25rem"/>
            </button>
        </div>
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