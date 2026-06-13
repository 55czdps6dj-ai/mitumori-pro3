// @ts-nocheck
'use client';
import React, { useEffect } from 'react';
import { useStaffStore } from '../../staff/useStaffStore';

const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#003366] focus:bg-white transition-all shadow-sm"
    />
  </div>
);

const ElevatorToggle = ({ label, checked, onChange }: any) => (
  <label
    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
      checked
        ? 'border-[#003366] bg-blue-50/50'
        : 'border-slate-100 bg-slate-50'
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-lg">{checked ? '🛗' : '🏠'}</span>
      <span
        className={`text-xs font-black ${
          checked ? 'text-[#003366]' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
    <input
      type="checkbox"
      className="w-5 h-5 accent-[#003366]"
      checked={checked || false}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

const SelectField = ({ label, value, onChange, options, placeholder }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">
      {label}
    </label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#003366] focus:bg-white transition-all shadow-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default function CustomerTab({ store }: { store: any }) {
  const { customer, setCustomer } = store;
  const { staffList, fetchStaff } = useStaffStore();
  const staffOptions = staffList.map((staff: any) => ({
    value: staff.name,
    label: staff.name,
  }));
  const hasCurrentEstimator =
    customer?.estimator &&
    !staffOptions.some((option: any) => option.value === customer.estimator);
  const estimatorOptions = hasCurrentEstimator
    ? [{ value: customer.estimator, label: customer.estimator }, ...staffOptions]
    : staffOptions;

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return (
    <div className="space-y-6 pb-24 p-4">
      {/* 👤 基本情報 */}
      <section className="bg-white p-5 shadow-md border-t-4 border-[#003366] rounded-xl space-y-4">
        <h3 className="font-black text-[#003366] text-sm italic">
          👤 お客様基本情報
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="お客様氏名"
            value={customer?.name}
            onChange={(val) => setCustomer({ name: val })}
            placeholder="例：京王 太郎 様"
          />

          {/* 📱 改善ポイント：スマホで1列、タブレット以上(sm)で2列 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="作業予定日"
              type="date"
              value={customer?.moveDate}
              onChange={(val) => setCustomer({ moveDate: val })}
            />
            <InputField
              label="電話番号"
              type="tel"
              value={customer?.phone}
              onChange={(val) => setCustomer({ phone: val })}
              placeholder="090-0000-0000"
            />
          </div>

          <SelectField
            label="見積担当者"
            value={customer?.estimator}
            onChange={(val) => setCustomer({ estimator: val })}
            options={estimatorOptions}
            placeholder="担当者を選択"
          />
        </div>
      </section>

      {/* 🏠 住所情報 */}
      <section className="bg-white p-5 shadow-md border-t-4 border-slate-800 rounded-xl space-y-4">
        <h3 className="font-black text-slate-800 text-sm italic">
          🏠 住所・搬入出条件
        </h3>
        <div className="space-y-6">
          {/* 現住所 */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-4">
            <InputField
              label="現住所（発地）"
              value={customer?.fromAddress}
              onChange={(val) => setCustomer({ fromAddress: val })}
              placeholder="東京都調布市..."
            />
            {/* 📱 階数とエレベーターもスマホでは縦並びにしてタップしやすく */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <InputField
                label="階数"
                type="number"
                value={customer?.floorFrom}
                onChange={(val) => setCustomer({ floorFrom: val })}
              />
              <ElevatorToggle
                label="エレベーター"
                checked={customer?.hasElevatorFrom}
                onChange={(val) => setCustomer({ hasElevatorFrom: val })}
              />
            </div>
          </div>

          {/* 転居先 */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-4">
            <InputField
              label="転居先（着地）"
              value={customer?.toAddress}
              onChange={(val) => setCustomer({ toAddress: val })}
              placeholder="神奈川県横浜市..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <InputField
                label="階数"
                type="number"
                value={customer?.floorTo}
                onChange={(val) => setCustomer({ floorTo: val })}
              />
              <ElevatorToggle
                label="エレベーター"
                checked={customer?.hasElevatorTo}
                onChange={(val) => setCustomer({ hasElevatorTo: val })}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
