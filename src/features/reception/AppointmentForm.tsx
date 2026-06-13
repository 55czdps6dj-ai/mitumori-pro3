// @ts-nocheck
import React, { useState } from 'react';
import { InputField, ConditionSelector } from './components/InputField';

// ══ 検索パネル ══════════════════════════════════════════════
const SearchPanel = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const STATUS_OPTIONS = [
    { value: '', label: 'すべて' },
    { value: '未対応', label: '未対応' },
    { value: 'TEL待ち', label: 'TEL待ち' },
    { value: '検討中', label: '検討中' },
    { value: '見積済み', label: '見積済み' },
    { value: '成約', label: '成約' },
    { value: 'キャンセル', label: 'キャンセル' },
  ];

  const handleSearch = () => {
    onSearch({ query, dateFrom, dateTo, statusFilter });
  };

  const handleClear = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    onSearch({ query: '', dateFrom: '', dateTo: '', statusFilter: '' });
  };

  const hasCondition = query || dateFrom || dateTo || statusFilter;

  return (
    <div className="border-b border-slate-200">
      {/* 検索トグルボタン */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full px-5 py-3.5 flex items-center justify-between transition-all ${
          isOpen ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🔍</span>
          <span className="text-sm font-black text-slate-700">顧客検索</span>
          {hasCondition && (
            <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              検索中
            </span>
          )}
        </div>
        <span
          className={`text-slate-400 text-xs font-black transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* 検索フォーム（折りたたみ） */}
      {isOpen && (
        <div className="px-5 pb-4 pt-2 bg-blue-50 space-y-3">
          {/* フリーワード検索 */}
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              氏名 / 電話番号 / 住所
            </label>
            <div className="relative mt-0.5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="例：山田、090-、東京都..."
                className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold outline-none focus:border-[#003366] bg-white"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">
                🔍
              </span>
            </div>
          </div>

          {/* 日付範囲 */}
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              作業日（見積日 / 引越日）
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-[#003366] bg-white"
              />
              <span className="text-slate-400 text-xs font-black shrink-0">
                〜
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-[#003366] bg-white"
              />
            </div>
          </div>

          {/* ステータス絞り込み */}
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              ステータス
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all border ${
                    statusFilter === opt.value
                      ? 'bg-[#003366] text-white border-[#003366]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 検索・クリアボタン */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleClear}
              className="flex-1 py-2 border-2 border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:bg-white transition-all"
            >
              クリア
            </button>
            <button
              onClick={handleSearch}
              className="flex-[2] py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black hover:bg-blue-800 transition-all shadow-md"
            >
              🔍 検索する
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══ 新規受付フォーム ════════════════════════════════════════
export const AppointmentForm = ({
  formData,
  setFormData,
  setViewMode,
  onSave,
  isSubmitting,
  onSearch, // ← 追加
}: any) => {
  const TIME_SLOTS = [
    { id: '①', label: '9:00〜11:00' },
    { id: '②', label: '11:00〜13:00' },
    { id: '③', label: '13:00〜15:00' },
    { id: '④', label: '15:00〜18:00' },
  ];

  return (
    <aside className="w-[420px] bg-white border-r shadow-2xl flex flex-col shrink-0">
      {/* ヘッダー */}
      <div className="p-6 bg-[#003366] text-white shrink-0">
        <h2 className="text-xl font-black italic tracking-tighter">
          📞 新規受付入力
        </h2>
      </div>

      {/* 🔍 検索パネル（ヘッダー直下） */}
      <SearchPanel onSearch={onSearch} />

      {/* 入力フォーム */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        <section className="space-y-4">
          <InputField
            label="お客様氏名"
            value={formData.name}
            onChange={(val) => setFormData({ ...formData, name: val })}
            placeholder="例：京王 太郎 様"
          />
          <InputField
            label="電話番号"
            type="tel"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            placeholder="090-0000-0000"
          />

          {/* 見積日時 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              formData.estimateDate
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-slate-50 border-dashed border-slate-300'
            }`}
          >
            <InputField
              label="見積希望日"
              type="date"
              value={formData.estimateDate}
              onFocus={() => setViewMode('estimate')}
              onChange={(val) =>
                setFormData({ ...formData, estimateDate: val })
              }
            />
            <div className="mt-4 space-y-2">
              <div className="flex bg-white p-1 rounded-xl border">
                {['slot', 'exact'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, estimateTimeMode: mode })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      formData.estimateTimeMode === mode
                        ? 'bg-[#003366] text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {mode === 'slot' ? '時間枠' : '指定'}
                  </button>
                ))}
              </div>
              {formData.estimateTimeMode === 'slot' ? (
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, estimateSlot: slot.id })
                      }
                      className={`p-2 rounded-xl border text-left transition-all ${
                        formData.estimateSlot === slot.id
                          ? 'border-[#003366] bg-blue-50 ring-2 ring-[#003366]'
                          : 'bg-white'
                      }`}
                    >
                      <div className="text-[10px] font-black text-slate-400">
                        {slot.id}
                      </div>
                      <div className="text-xs font-black text-[#003366]">
                        {slot.label}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <InputField
                  label="見積開始時間"
                  type="time"
                  value={formData.estimateTime}
                  onChange={(val) =>
                    setFormData({ ...formData, estimateTime: val })
                  }
                />
              )}
            </div>
          </div>

          {/* 引越日時 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              formData.moveDate
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-slate-50 border-dashed border-slate-300'
            }`}
          >
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="引越予定日"
                type="date"
                value={formData.moveDate}
                onFocus={() => setViewMode('move')}
                onChange={(val) => setFormData({ ...formData, moveDate: val })}
              />
              <InputField
                label="開始時間"
                type="time"
                value={formData.moveTime}
                onChange={(val) => setFormData({ ...formData, moveTime: val })}
              />
            </div>
          </div>

          {/* 住所・EV */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <InputField
              label="積地住所"
              value={formData.fromAddress}
              onChange={(val) => setFormData({ ...formData, fromAddress: val })}
            />
            <ConditionSelector
              label="積地"
              ev={formData.fromEV}
              onEvChange={(val) => setFormData({ ...formData, fromEV: val })}
            />
            <InputField
              label="着地住所"
              value={formData.toAddress}
              onChange={(val) => setFormData({ ...formData, toAddress: val })}
            />
            <ConditionSelector
              label="着地"
              ev={formData.toEV}
              onEvChange={(val) => setFormData({ ...formData, toEV: val })}
            />
          </div>

          {/* メモ欄 */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              メモ
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="特記事項・注意点など"
              className="mt-1 w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#003366] resize-none bg-white"
            />
          </div>
        </section>

        <button
          onClick={onSave}
          disabled={isSubmitting}
          className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all ${
            isSubmitting
              ? 'bg-slate-400 text-white cursor-not-allowed'
              : 'bg-[#003366] text-white hover:bg-blue-800'
          }`}
        >
          {isSubmitting ? '⏳ 登録中...' : '見積予約として登録'}
        </button>
      </div>
    </aside>
  );
};
