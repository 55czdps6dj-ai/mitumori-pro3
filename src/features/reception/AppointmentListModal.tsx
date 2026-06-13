// @ts-nocheck
import React, { useState } from 'react';
import { useReceptionStore } from './useReceptionStore';
import { calculateTotalWithTax } from '../estimate/calculateEstimateTotals';

const TIME_SLOTS = [
  { id: '①', label: '9:00〜11:00' },
  { id: '②', label: '11:00〜13:00' },
  { id: '③', label: '13:00〜15:00' },
  { id: '④', label: '15:00〜18:00' },
];

// ステータス定義（新体系）
const STATUS_LIST = [
  { key: '未対応', label: '未対応', color: 'bg-slate-500' },
  { key: '訪問日確定', label: '訪問日確定', color: 'bg-yellow-400' },
  { key: '見積済み', label: '見積済み', color: 'bg-blue-600' },
  { key: 'TEL待ち', label: 'TEL待ち', color: 'bg-orange-500' },
  { key: '成約', label: '成約', color: 'bg-emerald-500' },
  { key: 'キャンセル', label: 'キャンセル', color: 'bg-red-500' },
];

const BORDER_COLOR = {
  成約: '#10b981',
  キャンセル: '#ef4444',
  訪問日確定: '#facc15',
  見積済み: '#2563eb',
  TEL待ち: '#f97316',
  未対応: '#94a3b8',
};

// ══ 見積未保存警告ダイアログ ════════════════════════════════
const EstimateWarningDialog = ({ apptName, onSelect, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-[340px] overflow-hidden">
      <div className="bg-orange-500 px-6 py-4">
        <p className="text-white font-black text-base">
          ⚠️ 見積情報が未保存です
        </p>
        <p className="text-orange-100 text-[11px] font-bold mt-1">
          見積システムで「💾 DBに保存」を押していない場合、
          <br />
          金額・車両・家財データが反映されません。
        </p>
      </div>
      <div className="px-6 py-4">
        <p className="text-sm font-black text-slate-700 mb-4">
          {apptName} 様のステータスを選択してください
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onSelect('検討中')}
            className="w-full py-3 px-4 bg-yellow-50 border-2 border-yellow-300 rounded-2xl text-left hover:bg-yellow-100 transition-all"
          >
            <p className="text-sm font-black text-yellow-700">
              🤔 検討中のまま保留
            </p>
            <p className="text-[10px] text-yellow-600 font-bold">
              先に見積を保存してから成約にする
            </p>
          </button>
          <button
            onClick={() => onSelect('成約')}
            className="w-full py-3 px-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-left hover:bg-emerald-100 transition-all"
          >
            <p className="text-sm font-black text-emerald-700">✅ 成約</p>
            <p className="text-[10px] text-emerald-600 font-bold">
              見積未保存のまま成約にする
            </p>
          </button>
          <button
            onClick={() => onSelect('キャンセル')}
            className="w-full py-3 px-4 bg-red-50 border-2 border-red-200 rounded-2xl text-left hover:bg-red-100 transition-all"
          >
            <p className="text-sm font-black text-red-600">❌ キャンセル</p>
            <p className="text-[10px] text-red-400 font-bold">
              この案件をキャンセルにする
            </p>
          </button>
        </div>
      </div>
      <div className="px-6 pb-5">
        <button
          onClick={onClose}
          className="w-full py-2.5 border-2 border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all"
        >
          閉じる（何もしない）
        </button>
      </div>
    </div>
  </div>
);

// ══ メインコンポーネント ════════════════════════════════════
export const AppointmentListModal = ({
  date,
  appointments,
  onClose,
  onNavigateToEstimate,
  viewMode = 'estimate',
}: any) => {
  const { updateAppointment, deleteAppointment } = useReceptionStore();

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [warningTarget, setWarningTarget] = useState(null);

  if (!date) return null;

  const draft = (key: string, val: any) =>
    setEditDraft((prev) => ({ ...prev, [key]: val }));

  const startEdit = (appt) => {
    setEditingId(appt.id);
    setEditDraft({
      name: appt.name || '',
      phone: appt.phone || '',
      fromAddress: appt.fromAddress || '',
      toAddress: appt.toAddress || '',
      notes: appt.notes || '',
      estimateDate: appt.estimateDate || '',
      estimateTimeMode: appt.estimateTimeMode || 'slot',
      estimateSlot: appt.estimateSlot || '',
      estimateTime: appt.estimateTime || '',
      moveDate: appt.moveDate || '',
      moveTime: appt.moveTime || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async (id) => {
    if (!editDraft.name?.trim()) {
      alert('氏名を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      await updateAppointment(id, {
        name: editDraft.name,
        phone: editDraft.phone,
        fromAddress: editDraft.fromAddress,
        toAddress: editDraft.toAddress,
        notes: editDraft.notes,
        estimateDate: editDraft.estimateDate,
        estimateTimeMode: editDraft.estimateTimeMode,
        estimateSlot: editDraft.estimateSlot,
        estimateTime: editDraft.estimateTime,
        moveDate: editDraft.moveDate,
        moveTime: editDraft.moveTime,
      });
      setEditingId(null);
      setEditDraft({});
    } catch (e) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ══ 成約処理（警告付き） ════════════════════════════════
  const handleContract = async (appt) => {
    const ed = appt.estimateData || {};
    const hasEstimate =
      Number(ed.costs?.subtotal || 0) > 0 ||
      ed.trucks?.length > 0 ||
      ed.items?.length > 0;

    if (!hasEstimate) {
      setWarningTarget(appt);
      return;
    }
    await proceedToContract(appt);
  };

  const proceedToContract = async (appt) => {
    if (!appt.moveDate) {
      const ok = confirm(
        `📅 引越日が未入力です\n\n` +
          `引越日が設定されていないため、\n` +
          `引越しカレンダーに表示されません。\n\n` +
          `このまま成約にしますか？\n` +
          `（後から編集で追加できます）`
      );
      if (!ok) return;
    }
    await updateAppointment(appt.id, { status: '成約' });
  };

  const handleWarningSelect = async (status) => {
    const appt = warningTarget;
    setWarningTarget(null);
    if (!appt) return;
    if (status === '成約') {
      await proceedToContract(appt);
    } else if (status === 'キャンセル') {
      await updateAppointment(appt.id, { status: 'キャンセル' });
    }
    // 「検討中のまま保留」は何もしない
  };

  // ── 共通UIパーツ ─────────────────────────────────────
  const Field = ({ label, children }) => (
    <div>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-0.5">{children}</div>
    </div>
  );

  const inputCls =
    'w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-[#003366] bg-white';

  const EstimateTimeEditor = () => (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
      <p className="text-[9px] font-black text-slate-400 uppercase">見積時間</p>
      <div className="flex bg-white p-1 rounded-xl border">
        {['slot', 'exact'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => draft('estimateTimeMode', mode)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              editDraft.estimateTimeMode === mode
                ? 'bg-[#003366] text-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {mode === 'slot' ? '時間枠で選択' : '時間を直接指定'}
          </button>
        ))}
      </div>
      {editDraft.estimateTimeMode === 'slot' ? (
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => draft('estimateSlot', slot.id)}
              className={`p-2 rounded-xl border text-left transition-all ${
                editDraft.estimateSlot === slot.id
                  ? 'border-[#003366] bg-blue-50 ring-2 ring-[#003366]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
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
        <input
          type="time"
          value={editDraft.estimateTime}
          onChange={(e) => draft('estimateTime', e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );

  const MoveTimeEditor = () => (
    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
      <p className="text-[9px] font-black text-slate-400 uppercase">引越時間</p>
      <select
        value={editDraft.moveTime}
        onChange={(e) => draft('moveTime', e.target.value)}
        className={inputCls}
      >
        <option value="">時間未定</option>
        <option value="午前便">午前便</option>
        <option value="午後便">午後便</option>
        <option value="フリー便">フリー便</option>
        <optgroup label="時間指定">
          {[
            '08:00',
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
            '15:00',
            '16:00',
            '17:00',
          ].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );

  const getEstimateTimeLabel = (appt) => {
    if (appt.estimateTimeMode === 'exact' && appt.estimateTime)
      return appt.estimateTime;
    if (appt.estimateSlot) {
      const slot = TIME_SLOTS.find((s) => s.id === appt.estimateSlot);
      return slot ? `${slot.id} ${slot.label}` : appt.estimateSlot;
    }
    return null;
  };

  // ── 成約詳細パネル（引越しタブ用） ──────────────────
  const ContractDetailPanel = ({ appt }) => {
    const ed = appt.estimateData || {};
    const trucks = ed.trucks || [];
    const labors = ed.labors || [];
    const costs = ed.costs || {};
    const truckSummary =
      trucks.length > 0
        ? trucks.map((t) => `${t.type} × ${t.quantity}台`).join(' / ')
        : '未設定';
    const totalStaff = labors.reduce(
      (sum, l) => sum + Number(l.staffCount || 0),
      0
    );
    const subtotal = Number(costs.subtotal || 0);
    const total = calculateTotalWithTax(subtotal);

    return (
      <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm">
        <div className="bg-emerald-500 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-sm">✅ 成約</span>
            <span className="text-emerald-100 font-bold text-xs">
              {appt.name} 様
            </span>
          </div>
          <span className="text-emerald-100 text-[10px] font-bold">
            {appt.phone}
          </span>
        </div>
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">
                引越日時
              </p>
              <p className="text-sm font-black text-slate-800">
                {appt.moveDate ? (
                  <>
                    {appt.moveDate}
                    {appt.moveTime && (
                      <span className="ml-2 text-emerald-600">
                        {appt.moveTime}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-orange-400">📅 引越日未設定</span>
                )}
              </p>
            </div>
          </div>
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-black text-blue-600 shrink-0 mt-0.5">
                自
              </span>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400">引越元</p>
                <p className="text-xs font-bold text-slate-700">
                  {appt.fromAddress || '未入力'}
                  <span className="ml-1 text-[9px] text-slate-400">
                    ({appt.fromEV ? 'EV有' : '階段'})
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-black text-emerald-600 shrink-0 mt-0.5">
                至
              </span>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400">引越先</p>
                <p className="text-xs font-bold text-slate-700">
                  {appt.toAddress || '未入力'}
                  <span className="ml-1 text-[9px] text-slate-400">
                    ({appt.toEV ? 'EV有' : '階段'})
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100">
            <div className="bg-slate-50 rounded-xl p-2 text-center">
              <p className="text-[8px] font-black text-slate-400 mb-1">
                🚛 車両
              </p>
              <p className="text-[9px] font-black text-slate-800 leading-tight">
                {truckSummary}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 text-center">
              <p className="text-[8px] font-black text-slate-400 mb-1">
                👷 人員
              </p>
              <p className="text-sm font-black text-slate-800">
                {totalStaff > 0 ? `${totalStaff}名` : '未設定'}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-[8px] font-black text-slate-400 mb-1">
                💰 金額
              </p>
              <p className="text-[9px] font-black text-emerald-700 leading-tight">
                {total > 0 ? `¥${total.toLocaleString()}` : '未算出'}
              </p>
              {total > 0 && <p className="text-[7px] text-slate-400">税込</p>}
            </div>
          </div>
          {appt.notes && (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <p className="text-[9px] font-black text-yellow-700 uppercase mb-1">
                📝 メモ
              </p>
              <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap">
                {appt.notes}
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => startEdit(appt)}
              className="flex-1 py-2 border-2 border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-all"
            >
              ✏️ 編集
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToEstimate(appt);
              }}
              className="flex-[2] py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black hover:bg-blue-800 transition-all shadow-md"
            >
              見積詳細を開く ↗
            </button>
          </div>
        </div>
      </div>
    );
  };

  const contractedAppts = appointments.filter((a) => a.status === '成約');
  const otherAppts = appointments.filter((a) => a.status !== '成約');
  const modalTitle =
    viewMode === 'moving'
      ? `🚛 ${date.replace(/-/g, '/')} の引越案件`
      : `${date.replace(/-/g, '/')} の案件詳細`;

  return (
    <>
      {warningTarget && (
        <EstimateWarningDialog
          apptName={warningTarget.name}
          onSelect={handleWarningSelect}
          onClose={() => setWarningTarget(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
        <div className="w-[500px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* ヘッダー */}
          <div
            className={`p-6 text-white flex justify-between items-center shadow-lg ${
              viewMode === 'moving' ? 'bg-blue-700' : 'bg-[#003366]'
            }`}
          >
            <div>
              <h3 className="text-xl font-black italic tracking-tight">
                {modalTitle}
              </h3>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                {viewMode === 'moving'
                  ? `成約: ${contractedAppts.length}件 / 計: ${appointments.length}件`
                  : `Status Management (${appointments.length} items)`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-2xl"
            >
              ✕
            </button>
          </div>

          {/* リストエリア */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {appointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <span className="text-5xl mb-4">📅</span>
                <p className="font-black text-sm">この日の案件はありません</p>
              </div>
            ) : viewMode === 'moving' ? (
              /* ══ 引越しタブ ══ */
              <>
                {contractedAppts.length > 0 && (
                  <div className="space-y-3">
                    {contractedAppts.map((appt) =>
                      editingId === appt.id ? (
                        <div
                          key={appt.id}
                          className="bg-white border-2 border-emerald-200 rounded-[2rem] p-6 shadow-sm"
                        >
                          <EditForm
                            appt={appt}
                            editDraft={editDraft}
                            draft={draft}
                            inputCls={inputCls}
                            Field={Field}
                            EstimateTimeEditor={EstimateTimeEditor}
                            MoveTimeEditor={MoveTimeEditor}
                            cancelEdit={cancelEdit}
                            saveEdit={saveEdit}
                            isSaving={isSaving}
                          />
                        </div>
                      ) : (
                        <ContractDetailPanel key={appt.id} appt={appt} />
                      )
                    )}
                  </div>
                )}
                {otherAppts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase px-1">
                      その他の案件
                    </p>
                    {otherAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor:
                            BORDER_COLOR[appt.status] || '#94a3b8',
                        }}
                      >
                        <div>
                          <p className="text-sm font-black text-slate-700">
                            {appt.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {appt.status} / {appt.moveTime || '時間未定'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleContract(appt)}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all"
                          >
                            成約にする
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onNavigateToEstimate(appt);
                            }}
                            className="px-3 py-1.5 bg-[#003366] text-white rounded-xl text-[10px] font-black hover:bg-blue-800 transition-all"
                          >
                            見積 ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ══ 見積タブ ══ */
              appointments.map((appt: any) => (
                <div
                  key={appt.id}
                  className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all border-l-8"
                  style={{
                    borderLeftColor: BORDER_COLOR[appt.status] || '#94a3b8',
                  }}
                >
                  <div className="flex flex-col gap-4">
                    {editingId === appt.id ? (
                      <EditForm
                        appt={appt}
                        editDraft={editDraft}
                        draft={draft}
                        inputCls={inputCls}
                        Field={Field}
                        EstimateTimeEditor={EstimateTimeEditor}
                        MoveTimeEditor={MoveTimeEditor}
                        cancelEdit={cancelEdit}
                        saveEdit={saveEdit}
                        isSaving={isSaving}
                      />
                    ) : (
                      <ViewCard
                        appt={appt}
                        startEdit={startEdit}
                        onClose={onClose}
                        onNavigateToEstimate={onNavigateToEstimate}
                        updateAppointment={updateAppointment}
                        deleteAppointment={deleteAppointment}
                        getEstimateTimeLabel={getEstimateTimeLabel}
                        handleContract={handleContract}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ══ 編集フォーム ════════════════════════════════════════════
const EditForm = ({
  appt,
  editDraft,
  draft,
  inputCls,
  Field,
  EstimateTimeEditor,
  MoveTimeEditor,
  cancelEdit,
  saveEdit,
  isSaving,
}) => (
  <div className="space-y-3">
    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
      ✏️ 顧客情報を編集
    </p>
    <Field label="氏名 *">
      <input
        type="text"
        value={editDraft.name}
        onChange={(e) => draft('name', e.target.value)}
        className={inputCls}
      />
    </Field>
    <Field label="電話番号">
      <input
        type="tel"
        value={editDraft.phone}
        onChange={(e) => draft('phone', e.target.value)}
        className={inputCls}
      />
    </Field>
    <Field label="引越元住所">
      <input
        type="text"
        value={editDraft.fromAddress}
        onChange={(e) => draft('fromAddress', e.target.value)}
        className={inputCls}
      />
    </Field>
    <Field label="引越先住所">
      <input
        type="text"
        value={editDraft.toAddress}
        onChange={(e) => draft('toAddress', e.target.value)}
        className={inputCls}
        placeholder="後から入力OK"
      />
    </Field>
    <Field label="見積日">
      <input
        type="date"
        value={editDraft.estimateDate}
        onChange={(e) => draft('estimateDate', e.target.value)}
        className={inputCls}
      />
    </Field>
    <EstimateTimeEditor />
    <Field label="引越日">
      <input
        type="date"
        value={editDraft.moveDate}
        onChange={(e) => draft('moveDate', e.target.value)}
        className={inputCls}
      />
    </Field>
    <MoveTimeEditor />
    <Field label="メモ">
      <textarea
        value={editDraft.notes}
        rows={2}
        onChange={(e) => draft('notes', e.target.value)}
        className={`${inputCls} resize-none`}
      />
    </Field>
    <div className="flex gap-2 pt-2">
      <button
        onClick={cancelEdit}
        className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all"
      >
        キャンセル
      </button>
      <button
        onClick={() => saveEdit(appt.id)}
        disabled={isSaving}
        className="flex-[2] py-2.5 bg-[#003366] text-white rounded-xl text-xs font-black hover:bg-[#004499] transition-all shadow-md disabled:bg-slate-300"
      >
        {isSaving ? '保存中...' : '💾 保存する'}
      </button>
    </div>
  </div>
);

// ══ 表示カード（見積タブ用） ════════════════════════════════
const ViewCard = ({
  appt,
  startEdit,
  onClose,
  onNavigateToEstimate,
  updateAppointment,
  deleteAppointment,
  getEstimateTimeLabel,
  handleContract,
}) => (
  <>
    <div className="flex justify-between items-start">
      <div>
        <h4 className="text-xl font-black text-slate-800 leading-none mb-1">
          {appt.name}
        </h4>
        <p className="text-[10px] font-bold text-slate-400">{appt.phone}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => startEdit(appt)}
          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all"
        >
          ✏️ 編集
        </button>
        <button
          onClick={() => {
            onClose();
            onNavigateToEstimate(appt);
          }}
          className="px-4 py-2 bg-[#003366] text-white rounded-xl text-[10px] font-black shadow-lg active:scale-95 transition-all hover:bg-blue-800"
        >
          見積作成 ↗
        </button>
      </div>
    </div>

    {/* ステータス切替（新体系・2列グリッド） */}
    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
      {STATUS_LIST.map((btn) => (
        <button
          key={btn.key}
          onClick={() =>
            btn.key === '成約'
              ? handleContract(appt)
              : updateAppointment(appt.id, { status: btn.key })
          }
          className={`py-2 rounded-xl text-[10px] font-black transition-all ${
            appt.status === btn.key
              ? `${btn.color} text-white shadow-md scale-105`
              : 'text-slate-400 hover:bg-white hover:text-slate-600'
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>

    {/* 日時情報 */}
    <div className="space-y-1.5 border-t border-slate-100 pt-3">
      {appt.estimateDate && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-8 h-6 rounded-full bg-yellow-50 flex items-center justify-center text-[10px] font-black text-yellow-600 shrink-0">
            見
          </span>
          <span className="font-bold">{appt.estimateDate}</span>
          {getEstimateTimeLabel(appt) && (
            <span className="text-slate-400 font-bold">
              {getEstimateTimeLabel(appt)}
            </span>
          )}
        </div>
      )}
      {appt.moveDate && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-8 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">
            引
          </span>
          <span className="font-bold">{appt.moveDate}</span>
          {appt.moveTime && (
            <span className="text-slate-400 font-bold">{appt.moveTime}</span>
          )}
        </div>
      )}
    </div>

    {/* 住所情報 */}
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">
          自
        </div>
        <p className="text-xs font-bold text-slate-600 truncate">
          {appt.fromAddress || '住所未入力'}
          <span className="ml-2 text-[10px] text-slate-400">
            ({appt.fromEV ? 'EVあり' : '階段'})
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0">
          至
        </div>
        <p className="text-xs font-bold text-slate-600 truncate">
          {appt.toAddress || '住所未入力'}
          <span className="ml-2 text-[10px] text-slate-400">
            ({appt.toEV ? 'EVあり' : '階段'})
          </span>
        </p>
      </div>
    </div>

    {/* メモ表示 */}
    {appt.notes && (
      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
        <p className="text-[9px] font-black text-yellow-700 uppercase mb-1">
          📝 メモ
        </p>
        <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap">
          {appt.notes}
        </p>
      </div>
    )}

    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
      <span className="text-[10px] font-bold text-slate-300 italic">
        ID: {appt.id}
      </span>
      <button
        onClick={() =>
          confirm(`${appt.name} 様のデータを削除しますか？`) &&
          deleteAppointment(appt.id)
        }
        className="text-[10px] font-black text-red-200 hover:text-red-500 transition-colors"
      >
        🗑️ データを削除
      </button>
    </div>
  </>
);
