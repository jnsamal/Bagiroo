export default function ColourSelector({ variations, selected, onSelect }) {
  if (!variations.length) return null;

  return (
    <div>
      <p className="text-sm mb-2">Color: {selected?.colorName}</p>
      <div className="flex gap-2">
        {variations.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            title={v.colorName}
            className={`w-12 h-12 border ${selected?.id === v.id ? 'border-ink border-2' : 'border-border'}`}
            style={{ backgroundColor: v.colorHex || '#eee' }}
            aria-label={v.colorName}
          />
        ))}
      </div>
    </div>
  );
}
