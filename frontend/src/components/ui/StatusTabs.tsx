// src/components/ui/StatusTabs.tsx
interface StatusTabsProps {
    statuses: string[];
    activeStatus: string;
    onSelect: (status: string) => void;
  }
  
  export default function StatusTabs({ statuses, activeStatus, onSelect }: StatusTabsProps) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status}
            className={`px-3 py-1 rounded-full border ${
              activeStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onSelect(status)}
          >
            {status}
          </button>
        ))}
      </div>
    );
  }