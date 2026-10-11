import { responsiveMediaProps } from '../../lib/media';

export default function OptimizedImage({
  src,
  widths,
  sizes,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) {
  return (
    <img
      {...responsiveMediaProps(src, { widths, sizes })}
      loading={loading}
      decoding={decoding}
      {...props}
    />
  );
}
