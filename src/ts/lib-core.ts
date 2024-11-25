export function scale(value: number | string, xmin: number | string, xmax: number | string, ymin: number | string, ymax: number | string) {
    const xrange = Number(xmax) - Number(xmin)
    const yrange = Number(ymax) - Number(ymin)
    return (Number(value) - Number(xmin)) * yrange / xrange + Number(ymin)
}

export function rand(min: number, max: number) {
    return Math.floor(Math.max(min, Math.random() * max));
}