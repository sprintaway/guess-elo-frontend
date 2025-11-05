export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-emerald-400 mx-auto mb-4"></div>
        <p className="text-2xl text-gray-300">Loading game...</p>
      </div>
    </div>
  );
}