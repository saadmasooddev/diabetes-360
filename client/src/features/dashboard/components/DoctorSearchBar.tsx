import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DoctorSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function DoctorSearchBar({ searchQuery, onSearchChange }: DoctorSearchBarProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
          data-testid="icon-search"
        />
        <Input
          type="text"
          placeholder="Search by name or specialty"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-200"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#00453A',
          }}
          data-testid="input-search"
        />
      </div>
    </div>
  );
}

