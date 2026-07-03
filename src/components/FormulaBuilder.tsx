import { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Dices, Eraser, Play, Loader2 } from 'lucide-react';
import { payrollVariablesService } from '../services/payrollVariablesService';
import type { PayrollVariableDto } from '../types';

interface FormulaBuilderProps {
  formula: string;
  onChange: (formula: string) => void;
  onTest?: (formula: string) => Promise<void>;
  isTesting?: boolean;
}

const MATH_OPERATORS = [
  { symbol: '+', label: 'Suma' },
  { symbol: '-', label: 'Resta' },
  { symbol: '*', label: 'Multiplicación' },
  { symbol: '/', label: 'División' },
  { symbol: '(', label: 'Paréntesis abierto' },
  { symbol: ')', label: 'Paréntesis cerrado' },
  { symbol: '[', label: 'Corchete abierto' },
  { symbol: ']', label: 'Corchete cerrado' },
];

const LOGICAL_OPERATORS = [
  { symbol: '<', label: 'Menor que' },
  { symbol: '>', label: 'Mayor que' },
  { symbol: '<>', label: 'Diferente' },
  { symbol: '=', label: 'Igual' },
  { symbol: '<=', label: 'Menor o igual' },
  { symbol: '>=', label: 'Mayor o igual' },
];

const FUNCTIONS = [
  { template: 'IF(condicion, valor_si_true, valor_si_falso)', label: 'IF - Condicional' },
  { template: 'AND(cond1, cond2)', label: 'AND - Y lógico' },
  { template: 'OR(cond1, cond2)', label: 'OR - O lógico' },
  { template: 'NOT(condicion)', label: 'NOT - Negación' },
  { template: 'ROUND(valor, decimales)', label: 'ROUND - Redondear' },
  { template: 'MAX(val1, val2)', label: 'MAX - Máximo' },
  { template: 'MIN(val1, val2)', label: 'MIN - Mínimo' },
  { template: 'ABS(valor)', label: 'ABS - Valor absoluto' },
  { template: 'SUM(val1, val2, ...)', label: 'SUM - Sumatoria' },
  { template: 'AVERAGE(val1, val2, ...)', label: 'AVERAGE - Promedio' },
];

export function FormulaBuilder({ formula, onChange, onTest, isTesting }: FormulaBuilderProps) {
  const [variables, setVariables] = useState<PayrollVariableDto[]>([]);
  const [loadingVars, setLoadingVars] = useState(true);
  const [activeTab, setActiveTab] = useState<'variables' | 'operators' | 'functions'>('variables');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadingVars(true);
        const result = await payrollVariablesService.getList();
        if (result.isSuccess && result.value) {
          setVariables(result.value);
        }
      } catch {
        // ignore
      } finally {
        setLoadingVars(false);
      }
    }
    load();
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(formula + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newFormula = formula.substring(0, start) + text + formula.substring(end);
    onChange(newFormula);
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [formula, onChange]);

  const handleVariableInsert = (variableCode: string) => {
    insertAtCursor(`[${variableCode}]`);
  };

  const handleOperatorInsert = (symbol: string) => {
    insertAtCursor(` ${symbol} `);
  };

  const handleFunctionInsert = (template: string) => {
    insertAtCursor(template);
  };

  const handleDragStart = (e: React.DragEvent, data: string, type: 'variable' | 'operator' | 'function') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, data }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const { type, data } = JSON.parse(raw);
      if (type === 'variable') {
        insertAtCursor(`[${data}]`);
      } else if (type === 'operator') {
        insertAtCursor(` ${data} `);
      } else if (type === 'function') {
        insertAtCursor(data);
      }
    } catch {
      const text = e.dataTransfer.getData('text/plain');
      if (text) insertAtCursor(text);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const clearFormula = () => onChange('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['variables', 'operators', 'functions'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'variables' ? 'Variables' : tab === 'operators' ? 'Operadores' : 'Funciones'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
          {activeTab === 'variables' && (
            <div className="p-2 space-y-1">
              {loadingVars && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              {!loadingVars && variables.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No hay variables disponibles</p>
              )}
              {variables.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, v.code, 'variable')}
                  onDoubleClick={() => handleVariableInsert(v.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group cursor-grab active:cursor-grabbing transition-colors"
                  title={`Arrastrar o doble click para insertar ${v.name}`}
                >
                  <GripVertical className="h-3 w-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      [{v.code}]
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{v.name}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                    v.behavior === 1 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' :
                    v.behavior === 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {v.behavior === 1 ? 'F' : v.behavior === 2 ? 'V' : 'C'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'operators' && (
            <div className="p-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Matemáticos</p>
                <div className="flex flex-wrap gap-1.5">
                  {MATH_OPERATORS.map((op) => (
                    <button
                      key={op.symbol}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, op.symbol, 'operator')}
                      onDoubleClick={() => handleOperatorInsert(op.symbol)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-mono text-sm font-bold cursor-pointer transition-colors"
                      title={`${op.label} - Arrastrar o doble click`}
                    >
                      {op.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Lógicos</p>
                <div className="flex flex-wrap gap-1.5">
                  {LOGICAL_OPERATORS.map((op) => (
                    <button
                      key={op.symbol}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, op.symbol, 'operator')}
                      onDoubleClick={() => handleOperatorInsert(op.symbol)}
                      className="flex h-9 px-3 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-mono text-sm font-bold cursor-pointer transition-colors"
                      title={`${op.label} - Arrastrar o doble click`}
                    >
                      {op.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'functions' && (
            <div className="p-2 space-y-1">
              {FUNCTIONS.map((fn) => (
                <button
                  key={fn.template}
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, fn.template, 'function')}
                  onDoubleClick={() => handleFunctionInsert(fn.template)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group cursor-grab active:cursor-grabbing transition-colors"
                  title={`Arrastrar o doble click para insertar ${fn.label}`}
                >
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                    {fn.template}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{fn.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-3 space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fórmula
          </label>
          <textarea
            ref={textareaRef}
            value={formula}
            onChange={(e) => onChange(e.target.value)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            rows={4}
            className="input-field font-mono text-sm resize-none"
            placeholder="Arrastre variables, operadores y funciones aquí o escriba directamente..."
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearFormula}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Eraser className="h-3.5 w-3.5" />
              Limpiar
            </button>
            {onTest && (
              <button
                type="button"
                onClick={() => onTest(formula)}
                disabled={isTesting || !formula}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Probar fórmula
              </button>
            )}
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Arrastre elementos desde el panel izquierdo o haga doble click para insertarlos en la posición del cursor.
            Use <code className="text-indigo-500">[CODIGO_VAR]</code> para referenciar variables.
          </p>
        </div>
      </div>
    </div>
  );
}
