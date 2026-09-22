export default function ErrorState({ message = 'Something went wrong.' }) {
  return <p className="text-red-700 text-sm py-12 text-center">{message}</p>;
}
