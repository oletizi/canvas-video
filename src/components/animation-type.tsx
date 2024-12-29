import {MenuItem, Select} from "@mui/material";
import {AnimationType} from "@/video/song-animation";
import {useState} from "react";

export default function AnimationTypeSelector({onChange}) {
    const [selected, setSelected] = useState<String>('DEFAULT')
    return (<Select value={selected} onChange={(e) => {
        onChange(AnimationType[e.target.value])
        setSelected(e.target.value + "")
    }}>{Object.keys(AnimationType).filter((i) => isNaN(Number(i))).map(i => <MenuItem key={`animation-type-${i}`}
                                                                                      value={i}>{i}</MenuItem>)}</Select>)
}