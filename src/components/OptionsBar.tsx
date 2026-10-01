import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  EllipsisVertical,
  Loader2,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

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
    <>
      {/* Desktop / tablet (>=1024px): fila inline actual */}
      <div className="hidden lg:flex items-center gap-1.5">
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

      {/* Móvil (<1024px): botón flotante esquina superior derecha con menú desplegable.
          Portal a body: el header sticky z-30 crea stacking context y atrapa el z-index,
          dejando el botón invisible detrás del header móvil (z-40). */}
      {buttons.length > 0 &&
        createPortal(
          <div className="lg:hidden" ref={mobileRef}>
            <button
              type="button"
              aria-label="Opciones"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`fixed top-2 right-3 z-[45] flex h-11 w-11 items-center justify-center rounded-xl border shadow-md transition-colors ${
                mobileOpen
                  ? 'bg-indigo-700 dark:bg-indigo-700 border-indigo-800 text-white'
                  : 'bg-indigo-600 dark:bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700'
              }`}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <EllipsisVertical className="h-5 w-5" />}
            </button>

            {mobileOpen && (
              <div className="fixed top-16 right-3 z-[45] w-60 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 shadow-2xl py-1.5 animate-dropdown-in">
                {buttons.map((btn) => (
                  <button
                    key={btn.key}
                    type="button"
                    disabled={btn.disabled}
                    onClick={() => {
                      setMobileOpen(false);
                      btn.onClick();
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {btn.loading ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    ) : (
                      <btn.icon className="h-5 w-5 shrink-0" />
                    )}
                    <span className="flex-1">{btn.tooltip}</span>
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
