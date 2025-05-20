// src/components/ui/EmptyState.tsx
export default function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-gray-500 mt-6 italic">{message}</p>
  );
}
