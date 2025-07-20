// import {fabric} from "fabric";
import * as fabric from "fabric";
import {scale} from '@/lib/lib-core'
import type {Song} from "@/song/song";
import type {VuMeter} from "@/ts/audio/vu-meter";
import {newWave} from "@/video/wave";
import type {WaveOptions} from "@/video/wave";
import {Face} from "@/video/face";
import {ConfigurablePixelAnimation} from "@/video/configurable-pixel-animation";
import {Canvas} from "fabric";

export enum AnimationType {
    DEFAULT,
    PulsingEye,
    Wanderer,
    Waves,
    Face,
    PixelConfig,
}

export enum PulsingEyeTheme {
    BlackHole = "Black Hole",
    HAL = "HAL",
    Sauron = "Sauron",
    Vaporwave = "Vaporwave",
}

export enum WandererTheme {
    BlackHole = "Black Hole",
    HAL = "HAL",
    Sauron = "Sauron",
    Vaporwave = "Vaporwave",
}

// TODO: Rename this to something more general—like, <Something>Component
export interface SongAnimation {
    setup(c: fabric.Canvas): void

    draw(c: fabric.Canvas): void
}

export function newDefaultAnimation(song: Song, fps: number) {
    return newAnimation(AnimationType.DEFAULT, song, fps)
}

export function newAnimation(type: AnimationType, song: Song, fps: number, theme?: PulsingEyeTheme | WandererTheme, configId?: string) {
    console.log(`New animation! type:`, type, `theme:`, theme, `configId:`, configId)
    switch (type) {
        case AnimationType.Wanderer:
            return new Wanderer(song, fps, theme as WandererTheme)
        case AnimationType.PulsingEye:
            return new PulsingEye(song, fps, theme as PulsingEyeTheme || PulsingEyeTheme.BlackHole)
        case AnimationType.Waves:
            return new Waves(song, fps)
        case AnimationType.PixelConfig:
            if (!configId) {
                console.warn('PixelConfig animation type requires configId, falling back to Face');
                return new Face(song, fps);
            }
            return new ConfigurablePixelAnimation(song, fps, configId)
        case AnimationType.Face:
        case AnimationType.DEFAULT:
        default:
            return new Face(song, fps)
    }
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

class Waves implements SongAnimation {
    private song: Song;
    private fps: number;
    private readonly vu: VuMeter
    private stars: any[] = []
    // @ts-ignore
    private firmament: fabric.Group
    // @ts-ignore
    private wave1: SongAnimation
    // @ts-ignore
    private wave2: SongAnimation
    // @ts-ignore
    private waveOpts1: WaveOptions
    // @ts-ignore
    private waveOpts2: WaveOptions
    private count = 0

    constructor(song: Song, fps: number) {
        this.song = song
        this.fps = fps
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {

        const w = c.width
        const h = c.height
        const background = new fabric.Rect({fill: '#333333', height: h, width: w})
        c.add(background)
        const s = []
        for (let i = 0; i < 2048; i++) {
            const dim = getRandomInt(5)
            const x = getRandomInt(w * 2)
            const y = getRandomInt(w * 2)
            const star = new fabric.Rect({fill: '#ffffff', height: dim, width: dim, top: y, left: x})
            this.stars.push({x: x, y: y, size: dim, star: star})
            s.push(star)
            c.add(star)
        }

        this.firmament = new fabric.Group(s)
        c.add(this.firmament)
        // this.firmament.center()

        this.waveOpts1 = {
            fill: '#aaaaaa',
            phase: 0,
            q: 1.2,
            speed: .001,
            vuMeter: this.song.newVuMeter(.001, .5, 60),
            // vuMeter: this.vu,
            waveHeight: h / 3,
            width: w,
            height: h,
        }
        this.waveOpts2 = {
            fill: "#999999",
            height: h,
            phase: 0.25,
            q: 1.2,
            speed: .0005,
            vuMeter: this.vu,
            waveHeight: h / 4,
            width: w
        }
        this.wave2 = newWave(this.waveOpts2)
        this.wave2.setup(c)

        this.wave1 = newWave(this.waveOpts1)
        this.wave1.setup(c)


        const spacing = 5
        const strokeWidth = 2
        const strokeColor = '#777777'
        const opacity = .2
        for (let i = 0; i < h; i += spacing) {
            const line = new fabric.Line([0, i, w, i], {
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                opacity: opacity
            })
            c.add(line)
        }
    }

    draw(c: fabric.Canvas) {
        const h = c.height
        this.count++
        for (let i = 0; i < this.stars.length; i += 8) {
            const s = this.stars[i]
            const star = s.star
            const dim = s.size * (1 + this.vu.getValue() * 6)
            star.set('width', dim)
            star.set('height', dim)
            star.set('left', s.x - dim / 2)
            star.set('top', s.y - dim / 2)
        }

        this.waveOpts1.q = this.waveOpts2.q = scale(this.vu.getValue(), 0, 1, 1.2, 1.7)

        this.waveOpts1.waveHeight = scale(this.vu.getValue(), 0, 1, h / 3, h)
        this.waveOpts2.waveHeight = scale(this.vu.getValue(), 0, 1, h / 4, h)
        this.wave2.draw(c)
        this.wave1.draw(c)
        if (this.count % 10 == 0) {
            this.firmament.rotate(this.count / 360)
        }

        if (this.waveOpts2.phase >= 1) {
            this.waveOpts2.phase = 0
        } else {
            this.waveOpts2.phase += this.waveOpts2.speed
        }

        if (this.waveOpts1.phase >= 1) {
            this.waveOpts1.phase = 0
        } else {
            this.waveOpts1.phase += this.waveOpts1.speed
        }

        if (this.count >= 36000) {
            this.count = 0
        }
    }

}

class Wanderer implements SongAnimation {
    private static DEFAULT_RADIUS = 100

    private readonly song: Song
    private readonly vu: VuMeter
    private circle: fabric.Circle = new fabric.Circle({radius: Wanderer.DEFAULT_RADIUS})
    private direction = 1
    private x = 1
    private y = 0
    private theme: WandererTheme;
    private background: fabric.Rect;

    constructor(song: Song, fps: number, theme: WandererTheme = WandererTheme.BlackHole) {
        this.song = song
        this.theme = theme
        this.vu = song.newVuMeter(0.1, 0.5, fps)
    }

    setup(c: fabric.Canvas) {
        const w = c.width;
        const h = c.height;
        
        // Setup based on theme
        switch (this.theme) {
            case WandererTheme.BlackHole:
                this.setupBlackHole(c, w, h);
                break;
            case WandererTheme.HAL:
                this.setupHAL(c, w, h);
                break;
            case WandererTheme.Sauron:
                this.setupSauron(c, w, h);
                break;
            case WandererTheme.Vaporwave:
                this.setupVaporwave(c, w, h);
                break;
        }
        
        this.y = h / 2;
        this.x = Wanderer.DEFAULT_RADIUS + 1;
        c.add(this.circle);
    }

    private setupBlackHole(c: fabric.Canvas, w: number, h: number) {
        // Black Hole theme - simple white background
        this.background = new fabric.Rect({fill: '#ffffff', height: h, width: w});
        c.add(this.background);
        
        this.circle = new fabric.Circle({
            radius: Wanderer.DEFAULT_RADIUS,
            fill: 'black',
            selectable: false
        });
    }

    private setupHAL(c: fabric.Canvas, w: number, h: number) {
        // HAL theme - black background with red wandering circle
        this.background = new fabric.Rect({fill: '#000000', height: h, width: w});
        c.add(this.background);
        
        this.circle = new fabric.Circle({
            radius: Wanderer.DEFAULT_RADIUS,
            fill: '#ff0000',
            stroke: '#666666',
            strokeWidth: 2,
            selectable: false
        });
    }

    private setupSauron(c: fabric.Canvas, w: number, h: number) {
        // Sauron theme - dark background with fiery orange wandering circle
        this.background = new fabric.Rect({fill: '#1a0f0f', height: h, width: w});
        c.add(this.background);
        
        this.circle = new fabric.Circle({
            radius: Wanderer.DEFAULT_RADIUS,
            fill: '#ff8c00',
            stroke: '#ff4500',
            strokeWidth: 3,
            selectable: false
        });
    }

    private setupVaporwave(c: fabric.Canvas, w: number, h: number) {
        // Vaporwave theme - gradient background with classic vaporwave colors
        // Create gradient background from dark purple to pink
        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: w, y2: h },
            colorStops: [
                { offset: 0, color: '#1a0033' },    // Dark purple
                { offset: 0.5, color: '#4a0066' },  // Medium purple
                { offset: 1, color: '#ff69b4' }     // Hot pink
            ]
        });
        
        this.background = new fabric.Rect({
            fill: gradient,
            height: h,
            width: w
        });
        c.add(this.background);
        
        // Add grid lines for retro aesthetic
        const gridSpacing = 50;
        const gridColor = '#ff00ff';
        const gridOpacity = 0.3;
        
        // Vertical grid lines
        for (let x = 0; x <= w; x += gridSpacing) {
            const line = new fabric.Line([x, 0, x, h], {
                stroke: gridColor,
                strokeWidth: 1,
                opacity: gridOpacity,
                selectable: false
            });
            c.add(line);
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= h; y += gridSpacing) {
            const line = new fabric.Line([0, y, w, y], {
                stroke: gridColor,
                strokeWidth: 1,
                opacity: gridOpacity,
                selectable: false
            });
            c.add(line);
        }
        
        // Main wandering circle with neon cyan
        this.circle = new fabric.Circle({
            radius: Wanderer.DEFAULT_RADIUS,
            fill: '#00ffff',
            stroke: '#ff00ff',
            strokeWidth: 6,
            selectable: false,
            shadow: new fabric.Shadow({
                color: '#00ffff',
                blur: 20,
                offsetX: 0,
                offsetY: 0
            })
        });
    }

    draw(c: Canvas) {
        const w = c.width//this.w = c?.width ? c.width : this.w
        const h = c.height//this.h = c?.height ? c.height : this.h
        const transport = this.song.getTransport()
        const r = this.circle.radius ? this.circle.radius : 10
        if (this.x - r <= 0 || this.x >= w - r) {
            this.direction *= -1
        }

        if (transport.isRunning()) {
            this.circle.setRadius(Wanderer.DEFAULT_RADIUS + Wanderer.DEFAULT_RADIUS * this.vu.getValue())
        }
        this.circle.top = (h / 2) - r
        this.x += this.direction
        this.circle.left = this.x - r
    }

}

class PulsingEye implements SongAnimation {
    private static DEFAULT_RADIUS = 100
    private r = PulsingEye.DEFAULT_RADIUS
    private circle: fabric.Circle = new fabric.Circle({radius: this.r})
    private max = this.r + this.r * .5
    private min = this.r - this.r * .5
    private direction = 1
    private song: Song;
    private fps: number;
    private vu: VuMeter;
    private theme: PulsingEyeTheme;
    private background: fabric.Rect;
    private outerRing: fabric.Circle;
    private innerRing: fabric.Circle;

    constructor(song: Song, fps: number, theme: PulsingEyeTheme = PulsingEyeTheme.BlackHole) {
        this.song = song
        this.fps = fps
        this.theme = theme
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {
        const w = c.width;
        const h = c.height;
        
        // Setup based on theme
        switch (this.theme) {
            case PulsingEyeTheme.BlackHole:
                this.setupBlackHole(c, w, h);
                break;
            case PulsingEyeTheme.HAL:
                this.setupHAL(c, w, h);
                break;
            case PulsingEyeTheme.Sauron:
                this.setupSauron(c, w, h);
                break;
            case PulsingEyeTheme.Vaporwave:
                this.setupVaporwave(c, w, h);
                break;
        }
    }

    private setupBlackHole(c: fabric.Canvas, w: number, h: number) {
        // Original PulsingEye configuration
        this.background = new fabric.Rect({fill: '#ffffff', height: h, width: w});
        c.add(this.background);
        
        this.circle = new fabric.Circle({
            radius: this.r,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: 'black'
        });
        c.add(this.circle);
    }

    private setupHAL(c: fabric.Canvas, w: number, h: number) {
        // HAL 9000 theme - red eye with black background and outer ring
        this.background = new fabric.Rect({fill: '#000000', height: h, width: w});
        c.add(this.background);
        
        // Outer ring (camera housing)
        this.outerRing = new fabric.Circle({
            radius: this.r + 20,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#333333',
            stroke: '#666666',
            strokeWidth: 3
        });
        c.add(this.outerRing);
        
        // Inner ring (lens)
        this.innerRing = new fabric.Circle({
            radius: this.r + 10,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#222222',
            stroke: '#444444',
            strokeWidth: 2
        });
        c.add(this.innerRing);
        
        // Main eye (red)
        this.circle = new fabric.Circle({
            radius: this.r,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#ff0000'
        });
        c.add(this.circle);
    }

    private setupSauron(c: fabric.Canvas, w: number, h: number) {
        // Sauron theme - fiery orange eye with dark background and flame effects
        this.background = new fabric.Rect({fill: '#1a0f0f', height: h, width: w});
        c.add(this.background);
        
        // Outer ring (dark metal)
        this.outerRing = new fabric.Circle({
            radius: this.r + 25,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#2a1a1a',
            stroke: '#8b4513',
            strokeWidth: 4
        });
        c.add(this.outerRing);
        
        // Inner ring (fire border)
        this.innerRing = new fabric.Circle({
            radius: this.r + 15,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#4a2a1a',
            stroke: '#ff4500',
            strokeWidth: 3
        });
        c.add(this.innerRing);
        
        // Main eye (fiery orange)
        this.circle = new fabric.Circle({
            radius: this.r,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#ff8c00'
        });
        c.add(this.circle);
    }

    private setupVaporwave(c: fabric.Canvas, w: number, h: number) {
        // Vaporwave theme - gradient background with classic vaporwave colors
        // Create gradient background from dark purple to pink
        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: w, y2: h },
            colorStops: [
                { offset: 0, color: '#1a0033' },    // Dark purple
                { offset: 0.5, color: '#4a0066' },  // Medium purple
                { offset: 1, color: '#ff69b4' }     // Hot pink
            ]
        });
        
        this.background = new fabric.Rect({
            fill: gradient,
            height: h,
            width: w
        });
        c.add(this.background);
        
        // Add grid lines for retro aesthetic
        const gridSpacing = 50;
        const gridColor = '#ff00ff';
        const gridOpacity = 0.3;
        
        // Vertical grid lines
        for (let x = 0; x <= w; x += gridSpacing) {
            const line = new fabric.Line([x, 0, x, h], {
                stroke: gridColor,
                strokeWidth: 1,
                opacity: gridOpacity,
                selectable: false
            });
            c.add(line);
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= h; y += gridSpacing) {
            const line = new fabric.Line([0, y, w, y], {
                stroke: gridColor,
                strokeWidth: 1,
                opacity: gridOpacity,
                selectable: false
            });
            c.add(line);
        }
        
        // Outer ring (neon cyan with glow)
        this.outerRing = new fabric.Circle({
            radius: this.r + 25,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#003333',
            stroke: '#00ffff',
            strokeWidth: 4,
            shadow: new fabric.Shadow({
                color: '#00ffff',
                blur: 15,
                offsetX: 0,
                offsetY: 0
            })
        });
        c.add(this.outerRing);
        
        // Inner ring (neon cyan with glow)
        this.innerRing = new fabric.Circle({
            radius: this.r + 15,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#002222',
            stroke: '#00cccc',
            strokeWidth: 3,
            shadow: new fabric.Shadow({
                color: '#00cccc',
                blur: 10,
                offsetX: 0,
                offsetY: 0
            })
        });
        c.add(this.innerRing);
        
        // Main eye (neon pink with glow)
        this.circle = new fabric.Circle({
            radius: this.r,
            selectable: false,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center',
            fill: '#ff00ff',
            shadow: new fabric.Shadow({
                color: '#ff00ff',
                blur: 20,
                offsetX: 0,
                offsetY: 0
            })
        });
        c.add(this.circle);
    }

    draw(c: fabric.Canvas) {
        const w = c.width;
        const h = c.height;
        const transport = this.song.getTransport();
        
        if (transport?.isRunning()) {
            this.r = PulsingEye.DEFAULT_RADIUS + PulsingEye.DEFAULT_RADIUS * this.vu.getValue();
        } else {
            this.r += this.direction;
            if (this.r <= this.min || this.r >= this.max) {
                this.direction *= -1;
            }
        }
        
        // Update based on theme
        switch (this.theme) {
            case PulsingEyeTheme.BlackHole:
                this.drawBlackHole(c, w, h);
                break;
            case PulsingEyeTheme.HAL:
                this.drawHAL(c, w, h);
                break;
            case PulsingEyeTheme.Sauron:
                this.drawSauron(c, w, h);
                break;
            case PulsingEyeTheme.Vaporwave:
                this.drawVaporwave(c, w, h);
                break;
        }
    }

    private drawBlackHole(c: fabric.Canvas, w: number, h: number) {
        // Update radius and keep the circle centered
        this.circle.set({
            radius: this.r,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.circle.setCoords();
    }

    private drawHAL(c: fabric.Canvas, w: number, h: number) {
        // Update all rings
        this.outerRing.set({
            radius: this.r + 20,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.outerRing.setCoords();
        
        this.innerRing.set({
            radius: this.r + 10,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.innerRing.setCoords();
        
        this.circle.set({
            radius: this.r,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.circle.setCoords();
    }

    private drawSauron(c: fabric.Canvas, w: number, h: number) {
        // Update all rings with fiery effects
        this.outerRing.set({
            radius: this.r + 25,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.outerRing.setCoords();
        
        this.innerRing.set({
            radius: this.r + 15,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.innerRing.setCoords();
        
        this.circle.set({
            radius: this.r,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.circle.setCoords();
    }

    private drawVaporwave(c: fabric.Canvas, w: number, h: number) {
        // Update all rings with neon effects
        this.outerRing.set({
            radius: this.r + 25,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.outerRing.setCoords();
        
        this.innerRing.set({
            radius: this.r + 15,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.innerRing.setCoords();
        
        this.circle.set({
            radius: this.r,
            left: w / 2,
            top: h / 2,
            originX: 'center',
            originY: 'center'
        });
        this.circle.setCoords();
    }
}

