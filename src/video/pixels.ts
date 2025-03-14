import {SongAnimation} from "@/video/song-animation";
import {Canvas, Rect} from "fabric";

export class Pixels implements SongAnimation {

    private readonly rows: Rect[][]
    private readonly cols: number
    private width = 0
    private height = 0

    constructor(cols: number = 16, rows: number = 16) {
        this.cols = cols
        this.rows = []
        for (let i = 0; i < rows; i++) {
            this.rows.push([])
        }
    }

    set(x: number, y: number, color: string) {
        this.rows[y][x].set({fill: color})
    }

    setup(c: Canvas) {
        const cols = this.cols
        const width = this.width = c.width ? c.width : 100
        const height = this.height = c.height ? c.height : 100
        let x = 0
        let y = 0
        let cellWidth = width / this.cols
        let cellHeight = height / this.rows.length
        for (const row of this.rows) {
            for (let i = 0; i < cols; i++) {
                const cell: Rect = new Rect({
                    left: x,
                    top: y,
                    width: cellWidth,
                    height: cellHeight,
                    fill: 'gray',
                    stroke: 'black',
                });
                c.add(cell);
                row.push(cell)
                x += cellWidth
            }
            y += cellHeight
            x = 0
        }
    }

    draw(c: Canvas) {
        if (c && c.width && c.height) {
            let resize = false
            if (this.width != c.width) {
                this.width = c.width
                resize = true
            }
            if (this.height != c.height) {
                this.height = c.height
                resize = true
            }
            if (resize) {
                let x = 0
                let y = 0
                let cellWidth = this.width / this.cols
                let cellHeight = this.height / this.rows.length
                for (const row of this.rows) {
                    for (const cell of row) {
                        cell.width = cellWidth
                        cell.height = cellHeight
                        cell.left = x
                        cell.top = y
                        x += cellWidth
                    }
                    x = 0
                    y += cellHeight
                }
            }
        }
    }
}