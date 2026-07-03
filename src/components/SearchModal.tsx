import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchColumn {
  key: string;
  label: string;
  render?: (value: unknown) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchRecord = Record<string, any> & { id: number };

interface SearchModalProps {
  open: boolean;
  title: string;
  records: SearchRecord[];
  isSearching: boolean;
  hasMore: boolean;
  onSearch: (query: string) => Promise<void>;
  onLoadMore: () => void;
  onSelect: (record: any) => void;
  onClose: () => void;
  columns?: SearchColumn[];
}

export function SearchModal({
  open,
  title,
  records,
  isSearching,
  hasMore,
  onSearch,
  onLoadMore,
  onSelect,
  onClose,
  columns,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const defaultColumns: SearchColumn[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs">{v as string}</span> },
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nombre' },
  ];

  const displayColumns = columns || defaultColumns;

  const handleSearch = useCallback(async () => {
    await onSearch(query);
  }, [query, onSearch]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleSearch();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, handleSearch]);

  useEffect(() => {
    if (!hasMore || !observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isSearching) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isSearching, onLoadMore]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escriba para buscar..."
              className="input-field flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {isSearching && records.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          )}

          {!isSearching && records.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              {query ? 'Sin resultados' : 'Ingrese un término de búsqueda'}
            </div>
          )}

          <div className="space-y-1">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelect(record)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">
                  <span className="text-xs font-mono">{record.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {displayColumns.map((col) => (
                      <span key={col.key} className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {col.render ? col.render(record[col.key]) : (record[col.key] as string)}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
