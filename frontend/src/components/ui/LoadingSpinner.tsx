export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="loading-spinner" role="status">
      <span className="loading-spinner-dot" />
      {label && <span>{label}</span>}
    </div>
  );
}
