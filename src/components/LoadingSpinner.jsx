export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-text-secondary">{message}</p>
      </div>
    </div>
  );
}
