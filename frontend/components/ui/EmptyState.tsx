export function EmptyState({ title = "No data available", message = "No records found for this view." }: { title?: string; message?: string }) {
  return (
    <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-2">
      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}
