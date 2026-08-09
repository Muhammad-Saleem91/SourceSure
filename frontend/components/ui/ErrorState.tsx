export function ErrorState({ title = "An error occurred", message = "Unable to process request." }: { title?: string; message?: string }) {
  return (
    <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 space-y-1 text-xs">
      <div className="font-bold flex items-center gap-2">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {title}
      </div>
      <p className="text-red-700 dark:text-red-300">{message}</p>
    </div>
  );
}
