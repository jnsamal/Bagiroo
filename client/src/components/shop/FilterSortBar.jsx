export default function FilterSortBar({ categories, selectedCategory, onCategoryChange, sort, onSortChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-between border-b border-border pb-6 mb-8">
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border border-border px-4 py-2 text-sm bg-background"
        aria-label="Filter by category"
      >
        <option value="">Categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="border border-border px-4 py-2 text-sm bg-background ml-auto"
        aria-label="Sort products"
      >
        <option value="latest">Sort by latest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </div>
  );
}
