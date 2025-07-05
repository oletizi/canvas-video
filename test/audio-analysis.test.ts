import { expect } from 'chai';
import { newVuFactory } from '../src/ts/audio/vu-meter';
import { nullSampleAnalyzer } from '../src/ts/audio/sample-analyzer';

// Mocha types are globally available
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;

describe('Audio Analysis and VU Meter', () => {
    it('should create a VU meter with proper default values', () => {
        const vuFactory = newVuFactory();
        const vuMeter = vuFactory.newVuMeter(0.05, 0.15, 60);
        
        expect(vuMeter.getValue()).to.equal(0);
        
        // Test setting a target value
        vuMeter.setTarget(0.5);
        vuMeter.update();
        
        // After one update, the value should be moving toward the target
        expect(vuMeter.getValue()).to.be.greaterThan(0);
        expect(vuMeter.getValue()).to.be.lessThanOrEqual(0.5);
    });

    it('should handle null sample analyzer gracefully', () => {
        const analyzer = nullSampleAnalyzer();
        
        expect(analyzer.getLevel()).to.equal(0);
        expect(analyzer.getFft()).to.deep.equal(new Float32Array([]));
    });

    it('should update VU meter factory correctly', () => {
        const vuFactory = newVuFactory();
        const vuMeter1 = vuFactory.newVuMeter(0.05, 0.15, 60);
        const vuMeter2 = vuFactory.newVuMeter(0.1, 0.2, 30);
        
        // Set target for all VU meters
        vuFactory.setTarget(0.8);
        vuFactory.update();
        
        // Both VU meters should be updated
        expect(vuMeter1.getValue()).to.be.greaterThan(0);
        expect(vuMeter2.getValue()).to.be.greaterThan(0);
    });
}); 