export function LoadingState({ message = "Loading content..." }: { message?: string }) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      <p className="text-xs text-gray-500 font-medium">{message}</p>
    </div>
  );
}
