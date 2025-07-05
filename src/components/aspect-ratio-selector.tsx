export enum AspectRatio {
    Widescreen = "16:9",
    Standard = "4:3", 
    Square = "1:1"
}

export default function AspectRatioSelector({ 
    onChange, 
    currentAspectRatio = AspectRatio.Widescreen 
}: { 
    onChange: (aspectRatio: AspectRatio) => void;
    currentAspectRatio?: AspectRatio;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Aspect Ratio:</label>
            <div className="flex gap-1">
                {Object.values(AspectRatio).map((aspectRatio) => (
                    <button
                        key={aspectRatio}
                        onClick={() => onChange(aspectRatio)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentAspectRatio === aspectRatio
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {aspectRatio}
                    </button>
                ))}
            </div>
        </div>
    );
} 