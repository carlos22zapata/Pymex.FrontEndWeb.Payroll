import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (records: number) => void;
}

export function Pagination({ page, recordsPerPage, onPageChange, onRecordsPerPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 flex-nowrap gap-4">
      <div className="flex items-center gap-2 flex-nowrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Registros por página:</span>
        <select
          value={recordsPerPage}
          onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
          className="input-field w-20 text-sm py-1.5"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
          Página {page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 10)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
