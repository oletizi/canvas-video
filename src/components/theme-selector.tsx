import { PulsingEyeTheme, WandererTheme } from "@/video/song-animation";
import { useState } from "react";

type ThemeType = PulsingEyeTheme | WandererTheme;

export default function ThemeSelector({ 
    onChange, 
    currentTheme,
    themes
}: { 
    onChange: (theme: ThemeType) => void;
    currentTheme: ThemeType;
    themes: ThemeType[];
}) {
    const [selected, setSelected] = useState<ThemeType>(currentTheme);

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Theme:</label>
            <div className="flex gap-1">
                {themes.map((theme) => (
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