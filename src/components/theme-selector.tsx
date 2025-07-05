import { PulsingEyeTheme } from "@/video/song-animation";
import { useState } from "react";

export default function ThemeSelector({ 
    onChange, 
    currentTheme = PulsingEyeTheme.BlackHole 
}: { 
    onChange: (theme: PulsingEyeTheme) => void;
    currentTheme?: PulsingEyeTheme;
}) {
    const [selected, setSelected] = useState<PulsingEyeTheme>(currentTheme);

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Theme:</label>
            <div className="flex gap-1">
                {Object.values(PulsingEyeTheme).map((theme) => (
                    <button
                        key={theme}
                        onClick={() => {
                            setSelected(theme);
                            onChange(theme);
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            selected === theme
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {theme}
                    </button>
                ))}
            </div>
        </div>
    );
} 