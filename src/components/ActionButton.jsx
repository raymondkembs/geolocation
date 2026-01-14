import React from 'react';

export default function ActionButton({
  label,
  onClick,
  color = 'gray',
  icon: Icon,
  disabled,
}) {
  const colorMap = {
    gray: 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20',
    red: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
    blue: 'bg-blue-900/10 text-blue-700 hover:bg-blue-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20',
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]
        font-medium transition ${colorMap[color]}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}
