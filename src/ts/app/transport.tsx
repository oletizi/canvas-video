export interface Transport {
    start()

    stop()

    reset()

    tick()

    isRunning(): boolean

    getPosition(): number
}

export function newTransport() : Transport {
    return new BasicTransport()
}

class BasicTransport implements Transport {
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