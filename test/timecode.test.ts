import {describe, it} from 'mocha'
import {newTimecode, timecode2Millis} from "../src/ts/app/timecode";
import {expect} from "chai";
describe('Timecode', () => {
    it('Creates a new timecode', () => {
        let fps = 24
        let tc = newTimecode('00:00:01:00.00')
        expect(tc.seconds).to.eq(1)
        let millis = timecode2Millis(fps, tc)
        expect(millis).to.eq(1000)

        tc = newTimecode("00:00:00:01.00")
        expect(tc.frames).to.eq(1)

        millis = timecode2Millis(fps, tc)
        expect(millis).to.eq(1/fps * 1000)
    })
})