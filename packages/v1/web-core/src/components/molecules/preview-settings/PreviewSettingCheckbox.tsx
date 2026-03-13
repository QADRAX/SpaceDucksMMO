'use client';

type Props = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

export function PreviewSettingCheckbox({ label, checked, onChange }: Props) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer appearance-none w-4 h-4 border border-border rounded bg-white checked:bg-neutral-900 checked:border-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200"
                />
                <svg
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity left-0.5 top-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">{label}</span>
        </label>
    );
}
