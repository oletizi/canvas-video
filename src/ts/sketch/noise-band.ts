import p5 from "p5";
import {rand} from "@/lib-core";
import {NoiseBandOptions} from "@/components/noise-band-control-panel";

export function noiseBand(p: p5, optset: NoiseBandOptions[]) {
    let rv: p5.Image
    for (let i = 0; i < optset.length; i++) {
        const opts = optset[i]
        const img = p.createImage(opts.getWidth(), opts.getHeight())
        const range = opts.getBandRange()
        for (let x = 0; x < img.width; x++) {
            for (let y = 0; y < img.height; y++) {
                if (y >= range.min && y < range.max) {
                    let c = opts.getColorRange();
                    img.set(x, y, [
                        rand(c.r.min, c.r.max),
                        rand(c.g.min, c.g.max),
                        rand(c.b.min, c.b.max),
                        rand(c.a.min, c.a.max)
                    ])
                } else {
                    const bg = opts.getBackground();
                    if (bg) {
                        img.set(x, y, [bg.r, bg.g, bg.b, bg.a])
                    }
                }
            }
        }
        img.updatePixels()
        opts.setClean()
        if (!rv) {
            rv = img
        } else {
            rv.copy(img, 0, 0, img.width, img.height, 0, 0, rv.width, rv.height)
        }
    }
    rv.filter('blur', optset[0].getBlur())

    return rv
}