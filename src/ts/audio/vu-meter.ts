export class VuMeter {
    private readonly attackTime: number;
    private readonly decayTime: number;
    private readonly fps: number;
    private currentValue: number;
    private targetValue: number;
    private readonly frameDuration: number;

    constructor(attackTime = 0.1, decayTime = 0.3, fps = 60) {
        this.attackTime = attackTime; // Time to respond to increase (in seconds)
        this.decayTime = decayTime;  // Time to decay (in seconds)
        this.fps = fps;              // Frames per second for updates

        this.currentValue = 0;       // Current VU level (0 to 1)
        this.targetValue = 0;        // Target VU level
        this.frameDuration = 1 / this.fps; // Duration of each frame
    }

    getValue(): number {
        return this.currentValue
    }

    // Update the current VU level based on the target level
    update() {
        const attackCoefficient = this.frameDuration / this.attackTime;
        const decayCoefficient = this.frameDuration / this.decayTime;

        if (this.currentValue < this.targetValue) {
            // Attack: Increase current value towards target
            this.currentValue += attackCoefficient * (this.targetValue - this.currentValue);
        } else if (this.currentValue > this.targetValue) {
            // Decay: Decrease current value towards target
            this.currentValue -= decayCoefficient * (this.currentValue - this.targetValue);
        }

        // Clamp current value between 0 and 1
        this.currentValue = Math.max(0, Math.min(1, this.currentValue));
    }

    // Set a new target value
    setTarget(value) {
        this.targetValue = Math.max(0, Math.min(1, value)); // Clamp target value between 0 and 1
    }
}