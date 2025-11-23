'use client';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'cards' | 'list';
  onViewChange: (view: 'cards' | 'list') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-800/60 rounded-lg p-1 border border-gray-700/50">
      <button
        onClick={() => onViewChange('cards')}
        className={`p-2 rounded transition-all ${
          view === 'cards'
            ? 'bg-green-500 text-black'
            : 'text-gray-400 hover:text-white'
        }`}
        title="Card View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded transition-all ${
          view === 'list'
            ? 'bg-green-500 text-black'
            : 'text-gray-400 hover:text-white'
        }`}
        title="List View"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

