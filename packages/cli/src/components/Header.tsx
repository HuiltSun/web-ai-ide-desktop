interface HeaderProps {
  projectId: string | null;
}

export function Header({ projectId }: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Web AI IDE</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {projectId ? `Project: ${projectId.slice(0, 8)}...` : 'No project selected'}
        </span>
      </div>
    </div>
  );
}
