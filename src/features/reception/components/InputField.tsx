// @ts-nocheck
import React from 'react';

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  onFocus,
  error,
}: any) => (
  <div className="flex flex-col gap-1.5 text-left">
    <label
      className={`text-[10px] font-black ml-1 uppercase tracking-wider ${
        error ? 'text-red-500' : 'text-slate-400'
      }`}
    >
      {label} {error && ' *'}
    </label>
    <input
      type={type}
      value={value ?? ''}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all shadow-sm ${
        error
          ? 'bg-red-50 border-red-200 focus:ring-red-500'
          : 'bg-slate-50 border-slate-200 focus:ring-[#003366] focus:bg-white'
      }`}
    />
  </div>
);

export const ConditionSelector = ({ label, ev, onEvChange }: any) => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {label}条件
    </span>
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => onEvChange(true)}
        className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${
          ev ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'
        }`}
      >
        EVあり
      </button>
      <button
        onClick={() => onEvChange(false)}
        className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${
          !ev ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400'
        }`}
      >
        階段のみ
      </button>
    </div>
  </div>
);
