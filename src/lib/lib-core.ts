import dayjs from "dayjs";

export function timestamp() {
    const d = dayjs()
    return `${d.year()}-${d.month()}-${d.day()}:${d.hour()}:${d.minute()}:${d.second()}`
}

export function pad(v: number, size: number) {
    let s = "" + v
    while (s.length < size) {
        s = "0" + s
    }
    return s
}

export function scale(value: number | string, xmin: number | string, xmax: number | string, ymin: number | string, ymax: number | string, exponent : number | string = 1) {
    // const xrange = Number(xmax) - Number(xmin)
    // const yrange = Number(ymax) - Number(ymin)
    // return (Number(value) - Number(xmin)) * yrange / xrange + Number(ymin)
    let normalized = (Number(value) - Number(xmin)) / (Number(xmax) - Number(xmin))

    // Apply exponential scaling if exponent is not 1
    if (exponent !== 1) {
        normalized = Math.pow(normalized, Number(exponent))
    }

    // Scale to the output range
    return Number(ymin) + normalized * (Number(ymax) - Number(ymin));
}

export function rand(min: number, max: number) {
    return Math.floor(Math.max(min, Math.random() * max));
}

export interface Result {
    errors: Error[]
    data: any
}