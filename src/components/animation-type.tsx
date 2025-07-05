import {AnimationType} from "@/video/song-animation";
import {useState} from "react";

export default function AnimationTypeSelector({onChange}: { onChange: (any) => void}) {
    const [selected, setSelected] = useState<string>('DEFAULT')
    return (
        <select 
            value={selected} 
            onChange={(e) => {
                onChange(AnimationType[e.target.value])
                setSelected(e.target.value)
            }}
            className="px-3 py-2 border border-gray-300 rounded"
        >
            {Object.keys(AnimationType).filter((i) => isNaN(Number(i))).map(i => 
                <option key={`animation-type-${i}`} value={i}>{i}</option>
            )}
        </select>
    )
}