import p5 from "p5";

class Position {
    x: number
    y: number
}

type EasingFunction = {
    (t: number): number
}

type Viewport = {
    width: number
    height: number
}

export class MotionText {
    private readonly text
    private readonly startPosition: Position
    private readonly endPosition: Position
    private readonly position: Position
    private readonly easeX: EasingFunction
    private readonly easeY: EasingFunction
    private tx: number = 0
    private ty: number = 0
    private readonly launchTime: number = 0
    private time = 0
    private viewport: Viewport

    constructor(text: string, startPosition: Position, endPosition: Position,
                easeX: EasingFunction = (t) => t,
                easeY: EasingFunction = (t) => t,
                launchTime = 0,
                viewport: Viewport = {width: window.innerWidth, height: window.innerHeight}
    ) {
        this.text = text
        this.startPosition = startPosition
        this.endPosition = endPosition
        this.position = {x: startPosition.x, y: startPosition.y}
        this.easeX = easeX
        this.easeY = easeY
        this.launchTime = launchTime
        this.viewport = viewport
    }

    setTime(time: number) {
        this.time = time
    }

    private visible() {
        return this.position.x >= 0
            && this.position.y >= 0
            && this.position.x <= this.viewport.width
            && this.position.y <= this.viewport.height
    }

    draw(p: p5) {
        if (this.visible() && this.time >= this.launchTime) {
            this.position.x = p.lerp(this.startPosition.x, this.endPosition.x, this.tx)
            this.position.y = p.lerp(this.startPosition.y, this.endPosition.y, this.ty)
            p.text(this.text, this.position.x, this.position.y)
            this.tx = this.easeX(this.tx)
            this.ty = this.easeY(this.ty)
        }
    }
}