import {describe, it} from 'mocha'
import {parseLyrics} from '../src/ts/app/lyrics.ts'
import {expect} from "chai";
import fs from "fs/promises";
import {timecode2Millis} from "../src/ts/app/timecode";

describe('LyricsParser', ()=> {
    it ('Parses lyric lines', () => {
        const lyrics = "Some nice text\non two separate lines";
        const timeText = parseLyrics(lyrics)
        expect(timeText.length).to.eq(2)
        let tt = timeText[0]
        expect(tt.time).to.equal(0)
        tt = timeText[1]
        expect(tt.time).to.equal(0)
    })

    it('Parses timecode and lyric lines', () => {
        const lyrics = "[00:00:01:01.01]\nThe first line\n[00:00:02:00.00]\nThe second line"
        const tt = parseLyrics(lyrics)
        expect(tt.length).to.eq(2)
    })

    it('Parses waves.txt', async () => {
        const lyrics = (await fs.readFile('src/lyrics/waves.txt')).toString()
        const parsed = parseLyrics(lyrics)
        expect(parsed.length).to.be.gt(8)
        let tt  = parsed[0]
        console.log(`millis: ${timecode2Millis(29.9, tt.time)}`)
    })
})