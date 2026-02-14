'use client';

import type { FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  buttonLabel: string;
  matchesLabel?: string;
  className?: string;
}

export default function PromptSearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  buttonLabel,
  matchesLabel,
  className,
}: PromptSearchBarProps) {
  const hasValue = value.trim().length > 0;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    onChange('');
    onSearch('');
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-2 md:flex-row md:items-center"
      >
        <div className="w-full md:max-w-md">
          <div className="group rounded-full bg-gradient-to-r from-slate-700/70 via-slate-600/40 to-slate-700/70 p-[1px] transition-all duration-200 focus-within:from-cyan-400/60 focus-within:via-blue-400/60 focus-within:to-emerald-400/60">
            <div className="flex items-center gap-3 rounded-full bg-gray-950/80 px-4 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] backdrop-blur">
              <Search className="h-4 w-4 text-cyan-200/80" />
              <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
              {hasValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-800 hover:text-gray-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
          >
            <Search className="h-4 w-4" />
            {buttonLabel}
          </button>
          {matchesLabel ? (
            <span className="rounded-full border border-gray-800/80 bg-gray-900/70 px-3 py-1 text-xs text-gray-200">
              {matchesLabel}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
