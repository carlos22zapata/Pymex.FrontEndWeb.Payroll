import {
  Plus,
  Save,
  Trash2,
  Search,
  Printer,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

interface OptionsBarButton {
  key: string;
  icon: LucideIcon;
  tooltip: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

interface OptionsBarProps {
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
  onFirst?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onLast?: () => void;
  showNav?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  canDelete?: boolean;
}

export function OptionsBar({
  onNew,
  onSave,
  onDelete,
  onSearch,
  onCancel,
  onPrint,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  showNav = false,
  isSaving = false,
  isDeleting = false,
  canDelete = true,
}: OptionsBarProps) {
  const buttons: OptionsBarButton[] = [
    ...(showNav
      ? [
          { key: 'first', icon: ChevronsLeft, tooltip: 'Primer registro', disabled: false, onClick: onFirst! },
          { key: 'prev', icon: ChevronLeft, tooltip: 'Registro anterior', disabled: false, onClick: onPrevious! },
          { key: 'next', icon: ChevronRight, tooltip: 'Registro siguiente', disabled: false, onClick: onNext! },
          { key: 'last', icon: ChevronsRight, tooltip: 'Último registro', disabled: false, onClick: onLast! },
        ]
      : []),
    ...(onNew
      ? [{ key: 'new', icon: Plus, tooltip: 'Nuevo registro', disabled: false, onClick: onNew }]
      : []),
    ...(onSave
      ? [{ key: 'save', icon: Save, tooltip: 'Guardar registro', disabled: isSaving, loading: isSaving, onClick: onSave }]
      : []),
    ...(onDelete
      ? [{ key: 'delete', icon: Trash2, tooltip: 'Borrar registro', disabled: !canDelete || isDeleting, loading: isDeleting, onClick: onDelete }]
      : []),
    ...(onSearch
      ? [{ key: 'search', icon: Search, tooltip: 'Opción de búsqueda', disabled: false, onClick: onSearch }]
      : []),
    ...(onCancel
      ? [{ key: 'cancel', icon: Ban, tooltip: 'Anular registro', disabled: false, onClick: onCancel }]
      : []),
    ...(onPrint
      ? [{ key: 'print', icon: Printer, tooltip: 'Imprimir', disabled: false, onClick: onPrint }]
      : []),
  ];

  return (
    <div className="flex items-center gap-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.key}
          type="button"
          title={btn.tooltip}
          disabled={btn.disabled}
          onClick={btn.onClick}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {btn.loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <btn.icon className="h-5 w-5" />
          )}
        </button>
      ))}
    </div>
  );
}
