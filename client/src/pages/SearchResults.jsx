import { Navigate, useSearchParams } from 'react-router-dom';
export default function SearchResults() {
  const [params] = useSearchParams();
  return <Navigate to="/" replace state={{ openSearch: true, searchQuery: params.get('q') || '' }} />;
}
