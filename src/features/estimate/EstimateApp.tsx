// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { useEstimateStore } from './useEstimateStore';
import { useReceptionStore } from '../reception/useReceptionStore';
import { calculateTaxAmount, calculateTotalWithTax } from './calculateEstimateTotals';
import CustomerTab from './tabs/CustomerTab';
import HouseholdTab from './tabs/HouseholdTab';
import WorkConditionTab from './tabs/WorkConditionTab';
import PricingTab from './tabs/PricingTab';
import ProposalTab from './tabs/ProposalTab';

// ==============================
// タブ定義
// ==============================

const TABS = [
  { id: 'customer', label: '顧客', icon: '👤' },
  { id: 'household', label: '家財', icon: '📦' },
  { id: 'labor', label: '作業条件', icon: '🛠' },
  { id: 'pricing', label: '料金', icon: '💰' },
  { id: 'proposal', label: '提案', icon: '📄' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ==============================
// ゴミデータ判定関数
// ==============================

/**
 * name フィールドが正当な家財名かどうかを判定する。
 * 旧バグコードで生成された ID 文字列（タイムスタンプ・英数字混在等）を除外する。
 */
const isValidItemName = (name: unknown): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  // 純粋な数字のみ → タイムスタンプ系ID
  if (/^\d+$/.test(trimmed)) return false;
  // 16文字以上の英数字のみ → UUID / タイムスタンプ+ランダム文字列
  if (/^[a-zA-Z0-9]{16,}$/.test(trimmed)) return false;
  // "LDK-ソファー-1780541971908" のような旧ID形式（末尾に10桁以上の数字）
  if (/^.+-\d{10,}/.test(trimmed)) return false;
  return true;
};

// ==============================
// コンポーネント
// ==============================

export default function EstimateApp({
  initialData,
  onBack,
}: {
  initialData: any;
  onBack: () => void;
}) {
  const store = useEstimateStore();
  const { appointments, updateFullEstimate, fetchAppointments } =
    useReceptionStore();

  const [activeTab, setActiveTab] = useState<TabId>('customer');
  const [isSaving, setIsSaving] = useState(false);

  const currentAppt =
    appointments.find((a) => a.id === initialData?.id) || initialData;

  // ────────────────────────────────────────
  // 1. 受付システムからのデータ引き継ぎ & 復元
  // ────────────────────────────────────────
  useEffect(() => {
    if (!initialData) return;

    // localStorageをクリアしてからリセット（persistの干渉を防ぐ）
    localStorage.removeItem('estimate-storage');

    // ストアをリセット
    if (typeof store.resetForLoad === 'function') store.resetForLoad();

    // 顧客情報を復元
    store.updateCustomer({
      name: initialData.name || '',
      phone: initialData.phone || '',
      fromAddress: initialData.fromAddress || '',
      toAddress: initialData.toAddress || '',
      moveDate: initialData.moveDate || '',
      moveTime: initialData.moveTime || '',
      hasElevatorFrom: initialData.fromEV ?? true,
      hasElevatorTo: initialData.toEV ?? false,
      notes: initialData.notes || '',
    });

    // 見積データを復元
    if (initialData.estimateData) {
      const d = initialData.estimateData;

      // ── 家財データの復元 ──────────────────────────────────
      if (d.items && Array.isArray(d.items) && d.items.length > 0) {
        const restoredItems = d.items
          .filter((i) => Number(i.quantity || 0) > 0)
          .filter((i) => isValidItemName(i.name)) // ← 旧バグで生成されたIDをスキップ
          .map((i) => ({
            id: i.id || `restored-${Date.now()}-${Math.random()}`,
            name: String(i.name),
            quantity: Number(i.quantity),
            pt: Number(i.pt || 0),
            roomId: i.roomId || '1',
            room: i.room || 'LDK',
          }));

        if (restoredItems.length > 0) {
          useEstimateStore.setState({
            items: restoredItems,
            totalPt: restoredItems.reduce(
              (sum, i) => sum + (i.pt || 0) * i.quantity,
              0
            ),
          });
        }
      }
      // ──────────────────────────────────────────────────────

      if (d.trucks && typeof store.setTrucks === 'function')
        store.setTrucks(d.trucks);
      if (d.labors && typeof store.setLabors === 'function')
        store.setLabors(d.labors);
      if (d.materials && typeof store.setMaterials === 'function')
        store.setMaterials(d.materials);
      if (d.services && typeof store.setServices === 'function')
        store.setServices(d.services);
      if (
        d.discountRate !== undefined &&
        typeof store.setDiscountRate === 'function'
      )
        store.setDiscountRate(d.discountRate);
      if (d.fixedDiscounts && typeof store.setFixedDiscounts === 'function')
        store.setFixedDiscounts(d.fixedDiscounts);
    }
  }, [initialData?.id]);

  // ────────────────────────────────────────
  // 2. DBへの保存処理
  // ────────────────────────────────────────
  const handleSaveToDatabase = async () => {
    if (!initialData?.id)
      return alert('顧客IDが見つからないため保存できません。');

    const currentName = String(store.customer?.name || '').trim();
    if (currentName === '') return alert('氏名を入力してください。');

    setIsSaving(true);
    try {
      const estimateSnapshot = {
        items: store.items
          .filter((i) => Number(i.quantity || 0) > 0)
          .filter((i) => isValidItemName(i.name)) // ← 保存時も念のためフィルター
          .map((i) => ({
            id: i.id,
            name: String(i.name),
            quantity: Number(i.quantity),
            pt: Number(i.pt || 0),
            roomId: i.roomId || '1',
            room: i.room || 'LDK',
          })),
        trucks: store.trucks || [],
        labors: store.labors || [],
        materials: store.materials || [],
        services: store.services || [],
        costs: store.costs || {},
        discountRate: store.discountRate || 0,
        fixedDiscounts: store.fixedDiscounts || [],
        updatedAt: new Date().toISOString(),
      };

      const customerFields = {
        name: currentName,
        phone: String(store.customer.phone || ''),
        fromAddress: String(store.customer.fromAddress || ''),
        toAddress: String(store.customer.toAddress || ''),
        fromEV: store.customer.hasElevatorFrom ?? true,
        toEV: store.customer.hasElevatorTo ?? false,
        moveDate: store.customer.moveDate || null,
        moveTime: store.customer.moveTime || null,
      };

      await updateFullEstimate(
        initialData.id,
        customerFields,
        estimateSnapshot
      );
      await fetchAppointments();
      alert(`${customerFields.name} 様の見積情報を保存しました。`);
    } catch (error) {
      console.error('Save Error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        alert(
          '【通信エラー】\nサーバーと通信できませんでした。\n\n・インターネット接続を確認してください\n・VPNを利用している場合はオフにしてみてください'
        );
      } else {
        alert(`保存に失敗しました。\n詳細: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────────────────────
  // 3. 印刷処理
  // ────────────────────────────────────────
  const handlePrint = () => {
    const {
      customer,
      costs,
      labors,
      trucks,
      items,
      services,
      fixedDiscounts,
      discountRate,
    } = store;
    const transportTotal = Number(costs?.transportTotal || 0);
    const laborTotal = Number(costs?.laborTotal || 0);
    const subtotal = Number(costs?.subtotal || 0);
    const tax = calculateTaxAmount(subtotal);
    const total = calculateTotalWithTax(subtotal);

    const serviceRows = (services || [])
      .filter((s) => Number(s.price) * Number(s.quantity || 1) > 0)
      .map(
        (s) =>
          `<tr><td>付帯：${s.name}</td><td style="text-align:right;">¥${(
            Number(s.price) * Number(s.quantity || 1)
          ).toLocaleString()}</td></tr>`
      )
      .join('');

    const discountRows = [];
    if (costs?.rateDiscountAmount > 0) {
      discountRows.push(
        `<tr class="discount-row"><td>基本料金割引 (${discountRate}%)</td><td style="text-align:right;">▲¥${Number(
          costs.rateDiscountAmount
        ).toLocaleString()}</td></tr>`
      );
    }
    (fixedDiscounts || []).forEach((d) => {
      if (Number(d.price) > 0) {
        discountRows.push(
          `<tr class="discount-row"><td>${
            d.name || '特別割引'
          }</td><td style="text-align:right;">▲¥${Number(
            d.price
          ).toLocaleString()}</td></tr>`
        );
      }
    });

    const activeItems = (items || []).filter(
      (i) => i && Number(i.quantity || 0) > 0
    );
    const mid = Math.ceil(activeItems.length / 2);
    const getItemRows = (start, end) =>
      activeItems
        .slice(start, end)
        .map(
          (i) =>
            `<tr><td>${i.name}</td><td style="text-align:right;font-weight:bold;width:25px;">${i.quantity}</td></tr>`
        )
        .join('');

    const htmlContent = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
      <style>
        @page { size: A4 landscape; margin: 5mm; }
        body { font-family: "Helvetica Neue", Arial, sans-serif; color: #222; margin: 0; padding: 0; line-height: 1.1; font-size: 8pt; }
        .container { width: 287mm; height: 200mm; border: 2px solid #000; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #003366; padding-bottom: 2px; margin-bottom: 8px; }
        .title-wrap h1 { font-size: 24pt; font-weight: 900; letter-spacing: 0.5em; margin: 0; color: #003366; }
        .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 8px; }
        .customer-name { font-size: 16pt; font-weight: bold; border-bottom: 2px solid #000; margin-bottom: 4px; padding-bottom: 2px; }
        .total-box { background: #003366; color: #fff; padding: 6px 15px; display: flex; align-items: center; justify-content: space-between; margin: 4px 0; }
        .total-box .val { font-size: 22pt; font-weight: 900; }
        .main-layout { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; flex-grow: 1; min-height: 0; overflow: hidden; }
        .left-column { display: flex; flex-direction: column; gap: 8px; }
        .right-column { border: 1px solid #333; padding: 5px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; overflow: hidden; }
        .inventory-title { font-weight: bold; border-bottom: 1px solid #333; margin-bottom: 3px; padding-bottom: 2px; font-size: 8pt; }
        #inventory-content { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-content: start; }
        table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
        th { background: #f2f2f2; border: 1px solid #333; padding: 2px 5px; text-align: left; }
        td { border: 1px solid #333; padding: 2px 5px; }
        .discount-row { color: #d32f2f; font-weight: bold; background: #fff5f5; }
        .item-table td { border-bottom: 1px solid #eee !important; border-left: none !important; border-right: none !important; border-top: none !important; padding: 1px 0 !important; }
      </style></head><body>
      <div class="container">
        <div class="header">
          <div class="title-wrap"><h1>御見積書</h1></div>
          <div style="text-align:right;">No: EST-${Math.floor(
            Date.now() / 1000
          )} / 発行日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        <div class="top-grid">
          <div>
            <div class="customer-name">${customer?.name || '　　　　'} 様</div>
            <div>
              <div>現住所：${customer?.fromAddress || '（未入力）'}</div>
              <div>新住所：${customer?.toAddress || '（未入力）'}</div>
              <div>連絡先：${customer?.phone || '（未入力）'}</div>
            </div>
          </div>
          <div>
            <div style="font-size:10pt;font-weight:bold;">京王運輸株式会社</div>
            〒182-0021 東京都調布市調布ヶ丘1-1-1<br>
            TEL: 042-XXX-XXXX / 担当：${customer?.estimator || '未設定'}
            <div class="total-box">
              <span style="font-size:8pt;">御見積合計(税込)</span>
              <span class="val">¥${total.toLocaleString()}-</span>
            </div>
          </div>
        </div>
        <div class="main-layout">
          <div class="left-column">
            <table>
              <thead><tr style="background:#f2f2f2;"><th>料金内訳明細</th><th style="width:80px;text-align:right;">金額(税抜)</th></tr></thead>
              <tbody>
                <tr><td>基本車両運賃</td><td style="text-align:right;">¥${transportTotal.toLocaleString()}</td></tr>
                <tr><td>作業人件費</td><td style="text-align:right;">¥${laborTotal.toLocaleString()}</td></tr>
                ${serviceRows}
                ${discountRows.join('')}
                <tr style="font-weight:bold;background:#fafafa;"><td>小計</td><td style="text-align:right;">¥${subtotal.toLocaleString()}</td></tr>
                <tr><td>消費税(10%)</td><td style="text-align:right;">¥${tax.toLocaleString()}</td></tr>
              </tbody>
            </table>
            <table>
              <thead><tr style="background:#f2f2f2;"><th colspan="2">作業条件</th></tr></thead>
              <tbody>
                <tr><td width="30%">引越予定日</td><td>${
                  customer?.moveDate || 'ご相談'
                } ${customer?.moveTime || ''}</td></tr>
                <tr><td>車両設定</td><td>${
                  trucks?.length > 0
                    ? trucks.map((t) => t.type + '×' + t.quantity).join(' / ')
                    : '未設定'
                }</td></tr>
                <tr><td>作業人員</td><td>${labors?.reduce(
                  (s, l) => s + Number(l.staffCount || 0),
                  0
                )}名</td></tr>
                <tr><td>環境</td><td>搬出:${
                  customer?.hasElevatorFrom ? 'EV有' : '階段'
                } / 搬入:${customer?.hasElevatorTo ? 'EV有' : '階段'}</td></tr>
              </tbody>
            </table>
            <div><strong>【備考】</strong><br>${
              customer?.notes || '標準引越運送約款に基づきお引受けいたします。'
            }</div>
          </div>
          <div class="right-column">
            <div class="inventory-title">■ 家財明細内訳</div>
            <div id="inventory-content">
              <table class="item-table"><tbody>${getItemRows(
                0,
                mid
              )}</tbody></table>
              <table class="item-table"><tbody>${getItemRows(
                mid,
                activeItems.length
              )}</tbody></table>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 700); };
        window.onafterprint = function() { window.close(); };
      </script>
    </body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win)
      win.onload = () => setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  // ==============================
  // レンダリング
  // ==============================
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* ヘッダー */}
      <header className="bg-[#003366] text-white p-3 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-white hover:bg-white/10 p-1 rounded transition"
          >
            ⬅ 戻る
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#003366] px-1.5 py-0.5 font-black italic text-xs rounded">
              KEIO
            </div>
            <h1 className="font-black text-sm uppercase tracking-tight">
              引越見積システム v3.5
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className={`${
              isSaving ? 'bg-slate-500' : 'bg-green-500 hover:bg-green-600'
            } text-white px-4 py-1.5 rounded text-[10px] font-black shadow-lg transition active:scale-95`}
          >
            {isSaving ? '⏳ 保存中...' : '💾 DBに保存'}
          </button>
          <button
            onClick={() => confirm('消去しますか？') && store.clearEstimate()}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[10px] font-black transition"
          >
            🗑️ クリア
          </button>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="bg-white border-b border-slate-200 flex shadow-sm z-10 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[58px] py-2.5 flex flex-col items-center gap-0.5 relative transition ${
              activeTab === tab.id
                ? 'text-[#003366] font-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[9px] font-bold whitespace-nowrap">
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 w-full h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </nav>

      {/* ステータスバー */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex justify-between items-center shrink-0">
        <span className="text-sm font-black text-slate-800">
          {currentAppt?.name || '新規'} 様
        </span>
        <div className="flex items-center gap-2">
          {store.totalPt > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-600 border border-red-200">
              家財: {store.totalPt}P
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-blue-100 border-blue-300 text-blue-700">
            ステータス: {currentAppt?.status || '未定義'}
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 relative overflow-y-auto bg-slate-50">
        <div className="max-w-screen-xl mx-auto pb-24">
          {activeTab === 'customer' && <CustomerTab store={store} />}
          {activeTab === 'household' && <HouseholdTab store={store} />}
          {activeTab === 'labor' && <WorkConditionTab store={store} />}
          {activeTab === 'pricing' && <PricingTab store={store} />}
          {activeTab === 'proposal' && (
            <ProposalTab store={store} onPrintClick={handlePrint} />
          )}
        </div>
      </main>
    </div>
  );
}
