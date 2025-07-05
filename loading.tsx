// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-900">
      <div className="flex items-center space-x-2">
        <div className="h-5 w-5 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
        <span className="text-blue-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}
