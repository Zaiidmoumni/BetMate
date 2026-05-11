// src/components/ui/EmptyState.tsx

interface EmptyStateProps {
    message: string
  }
  
  export default function EmptyState({ message }: EmptyStateProps) {
    return (
      <div className="p-8 text-center rounded-lg bg-[#1e1e1e]">
        <p className="text-gray-400">{message}</p>
      </div>
    )
  }