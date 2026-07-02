'use client';

interface Props {
  accents: readonly string[];
  value: string;
  onChange: (color: string) => void;
}

export default function AccentPicker({ accents, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Couleur d'accent" className="flex flex-wrap gap-2.5">
      {accents.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Accent ${color}`}
            onClick={() => onChange(color)}
            className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
              selected ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-modal' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}
