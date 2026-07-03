interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

export function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="toggle-track relative">
        <div className="toggle-thumb" />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}
