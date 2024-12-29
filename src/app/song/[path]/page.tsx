import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";

export default async function Page({params}:{params: Promise<{path: string}>}) {
    const song = newSong()

    const p = (await params).path
    return (<SongView song={song} url={`/api/audio/${p}`}/>)
}