import { useState } from 'react';

export default function FilterSortBar({ categories, selectedCategory, onCategoryChange, sort, onSortChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="border-b border-border pb-6 mb-8">
      <button type="button" aria-expanded={mobileOpen} aria-controls="mobile-product-filters" onClick={() => setMobileOpen(value => !value)} className="flex min-h-12 w-full items-center justify-between border border-border px-4 text-sm sm:hidden"><span>Filter and sort</span><span aria-hidden="true">{mobileOpen ? '−' : '+'}</span></button>
      <div id="mobile-product-filters" className={`${mobileOpen ? 'flex' : 'hidden'} mt-3 flex-col gap-3 sm:mt-0 sm:flex sm:flex-row sm:items-center sm:justify-between`}>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="form-field sm:w-auto"
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
        className="form-field sm:ml-auto sm:w-auto"
        aria-label="Sort products"
      >
        <option value="latest">Sort by latest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
      </div>
    </div>
  );
}
