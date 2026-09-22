import ProductCard from './ProductCard';

export default function ProductGrid({ products, columns = 4 }) {
  const colClass = columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <div className={`grid grid-cols-2 ${colClass} auto-rows-fr items-stretch gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-10`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
