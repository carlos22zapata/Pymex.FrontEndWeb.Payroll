import { useRef, useState, useCallback, useEffect } from 'react';

interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const DECIMAL_SEP = '.';
const THOUSANDS_SEP = ',';
const DECIMALS = 2;

export function formatNumber(num: number): string {
  const fixed = num.toFixed(DECIMALS);
  const parts = fixed.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEP);
  return `${intPart}${DECIMAL_SEP}${parts[1]}`;
}

function parseInput(text: string): number {
  const normalized = text.replace(new RegExp(`\\${THOUSANDS_SEP}`, 'g'), '').replace(DECIMAL_SEP, '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function DecimalInput({ value, onChange, placeholder, className = '', disabled, onKeyDown }: DecimalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDisplayText(formatNumber(value));
    }
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(new RegExp(`[^0-9\\${DECIMAL_SEP}]`, 'g'), '');
    const decimalCount = sanitized.split(DECIMAL_SEP).length - 1;
    const final = decimalCount > 1 ? sanitized.replace(new RegExp(`\\${DECIMAL_SEP}`, ''), '') : sanitized;
    setDisplayText(final);
    onChange(final ? parseInput(final) : 0);
  };

  const handleBlur = () => {
    setDisplayText(formatNumber(value));
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayText}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
