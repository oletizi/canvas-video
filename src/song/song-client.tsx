import {newSong, Song} from "@/song/song";
import {createRoot, Root} from "react-dom/client";
import {SongView} from "@/components/song-view";

console.log(`Song client!`)
const song = newSong()
const htmlRoot = document.getElementById('song')
if (htmlRoot) {
    const client = newSongClient(song, htmlRoot)
    client.render()
}

export interface SongClient {
    render(): void;
}

export function newSongClient(song: Song, root: HTMLElement) : SongClient {
    return new SongClientBase(song, root)
}

class SongClientBase implements SongClient {
    private readonly song: Song
    private readonly root: Root
    constructor (song, root) {
        this.song = song
        this.root = createRoot(root)
    }

    render(): void {
        this.root.render(<SongView song={this.song} url={'/'}/>)
    }

}