// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useReceptionStore } from './useReceptionStore';
import type { Appointment, AppointmentStatus } from './useReceptionStore';
import { CalendarView } from './CalendarView';
import { AppointmentForm } from './AppointmentForm';
import { AppointmentListModal } from './AppointmentListModal';
import StaffSettingsPanel from '../staff/StaffSettingsPanel';

// ==============================
// 定数
// ==============================
const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: '未対応', label: '未対応' },
  { value: '訪問日確定', label: '訪問日確定' },
  { value: '見積済み', label: '見積済み' },
  { value: 'TEL待ち', label: 'TEL待ち' },
  { value: '成約', label: '成約' },
  { value: 'キャンセル', label: 'キャンセル' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  未対応: { bg: 'bg-slate-200', text: 'text-slate-700' },
  訪問日確定: { bg: 'bg-blue-200', text: 'text-blue-800' },
  見積済み: { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  TEL待ち: { bg: 'bg-orange-200', text: 'text-orange-800' },
  成約: { bg: 'bg-green-200', text: 'text-green-800' },
  キャンセル: { bg: 'bg-red-200', text: 'text-red-800' },
};

// ==============================
// SearchResultModal（検索結果モーダル）
// ==============================
interface SearchResultModalProps {
  results: Appointment[];
  keyword: string;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  onStartEstimate: (appt: Appointment) => void;
  onOpenList: (appt: Appointment) => void;
}

function SearchResultModal({
  results,
  keyword,
  onClose,
  onSelectDate,
  onStartEstimate,
  onOpenList,
}: SearchResultModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-black text-sm">🔍 検索結果</h2>
          <div className="text-[10px] text-blue-200 mt-0.5">
            「{keyword || '全件'}」— {results.length}件ヒット
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold"
        >
          ✕ 閉じる
        </button>
      </header>

      {/* 結果リスト */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {results.length === 0 && (
          <div className="text-center text-slate-400 py-16 text-sm">
            条件に一致する案件は見つかりませんでした
          </div>
        )}

        {results.map((appt) => {
          const badge = STATUS_BADGE[appt.status] || STATUS_BADGE['未対応'];
          return (
            <div
              key={appt.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* カードヘッダー */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    {appt.status}
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {appt.name} 様
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {appt.moveDate || appt.estimateDate || '日付未定'}
                </span>
              </div>

              {/* 住所・電話 */}
              <div className="px-3 py-2 text-[11px] text-slate-600 space-y-0.5">
                {appt.phone && <div>📞 {appt.phone}</div>}
                {appt.fromAddress && <div>📍 搬出: {appt.fromAddress}</div>}
                {appt.toAddress && <div>📍 搬入: {appt.toAddress}</div>}
                {appt.moveDate && (
                  <div>
                    🚚 引越: {appt.moveDate} {appt.moveTime || ''}
                  </div>
                )}
                {appt.memo && (
                  <div className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded mt-1">
                    📝 {appt.memo}
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="px-3 pb-3 flex gap-2">
                {appt.moveDate && (
                  <button
                    onClick={() => {
                      onSelectDate(appt.moveDate!.substring(0, 10));
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-[#003366] text-white hover:bg-blue-900 transition"
                  >
                    📅 カレンダーで見る
                  </button>
                )}
                <button
                  onClick={() => {
                    onStartEstimate(appt);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                >
                  📝 見積を開く
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==============================
// ReceptionApp メインコンポーネント
// ==============================
interface ReceptionAppProps {
  onStartEstimate: (appt: Appointment) => void;
}

export default function ReceptionApp({ onStartEstimate }: ReceptionAppProps) {
  const { appointments, fetchAppointments, isLoading } = useReceptionStore();

  // ────────────────────────────────────────
  // State
  // ────────────────────────────────────────
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const [viewMode, setViewMode] = useState<'estimate' | 'moving'>('estimate');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'form'>('calendar');

  // 検索
  const [searchResults, setSearchResults] = useState<Appointment[] | null>(
    null
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearchResult, setShowSearchResult] = useState(false);

  // 設定画面
  const [showSettings, setShowSettings] = useState(false);

  // ────────────────────────────────────────
  // 初回データ取得 + 30秒自動リロード
  // ────────────────────────────────────────
  useEffect(() => {
    fetchAppointments();

    const timer = setInterval(() => {
      fetchAppointments();
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  // ────────────────────────────────────────
  // カレンダー操作
  // ────────────────────────────────────────
  const handlePrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowListModal(true);
  };

  // 検索結果からカレンダー日付にジャンプ
  const handleSelectDateFromSearch = (dateStr: string) => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setSelectedDate(dateStr);
    }
  };

  // ────────────────────────────────────────
  // 選択日の案件フィルタ
  // ────────────────────────────────────────
  const selectedAppts = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((a) => {
      const dateKey =
        viewMode === 'moving'
          ? a.moveDate?.substring(0, 10)
          : (a.estimateDate || a.visitDate)?.substring(0, 10);
      return dateKey === selectedDate;
    });
  }, [appointments, selectedDate, viewMode]);

  // ────────────────────────────────────────
  // 検索ロジック
  // ────────────────────────────────────────
  const handleSearch = useCallback(
    (params: {
      keyword: string;
      dateFrom: string;
      dateTo: string;
      status: string;
    }) => {
      const { keyword, dateFrom, dateTo, status } = params;

      // 全て空の場合はモーダルを閉じる
      if (!keyword && !dateFrom && !dateTo && !status) {
        setShowSearchResult(false);
        setSearchResults(null);
        return;
      }

      const kw = keyword.toLowerCase();

      const results = appointments.filter((a) => {
        // フリーワード検索（氏名・電話・住所）
        if (kw) {
          const target = [
            a.name || '',
            a.phone || '',
            a.fromAddress || '',
            a.toAddress || '',
            a.memo || '',
            a.notes || '',
          ]
            .join(' ')
            .toLowerCase();
          if (!target.includes(kw)) return false;
        }

        // 引越日範囲
        if (dateFrom && a.moveDate) {
          if (a.moveDate.substring(0, 10) < dateFrom) return false;
        }
        if (dateTo && a.moveDate) {
          if (a.moveDate.substring(0, 10) > dateTo) return false;
        }

        // ステータス絞り込み
        if (status && a.status !== status) return false;

        return true;
      });

      setSearchKeyword(
        keyword || (status ? `ステータス: ${status}` : '日付絞り込み')
      );
      setSearchResults(results);
      setShowSearchResult(true);
    },
    [appointments]
  );

  // ────────────────────────────────────────
  // 月サマリー（タブ切り替えエリア）
  // ────────────────────────────────────────
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthlyAppts = React.useMemo(() => {
    return appointments.filter((a) => {
      const dateKey =
        viewMode === 'moving'
          ? a.moveDate?.substring(0, 7)
          : (a.estimateDate || a.visitDate)?.substring(0, 7);
      return dateKey === monthKey;
    });
  }, [appointments, viewMode, monthKey]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    monthlyAppts.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [monthlyAppts]);

  // ==============================
  // レンダリング
  // ==============================
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center gap-2">
          <div className="bg-white text-[#003366] px-1.5 py-0.5 font-black italic text-xs rounded">
            KEIO
          </div>
          <h1 className="font-black text-sm tracking-tight">
            受付管理システム
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-[10px] text-blue-200 animate-pulse">
              更新中...
            </span>
          )}
          <button
            onClick={() => fetchAppointments()}
            className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition"
          >
            🔄 更新
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition"
            title="担当者設定"
          >
            ⚙️ 設定
          </button>
        </div>
      </header>

      {/* タブ（見積/引越し切り替え） */}
      <div className="flex bg-white border-b border-slate-200 shrink-0 shadow-sm">
        {(['estimate', 'moving'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              setSelectedDate(null);
              setShowListModal(false);
            }}
            className={[
              'flex-1 py-2.5 text-sm font-black transition relative',
              viewMode === mode
                ? 'text-[#003366]'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            {mode === 'estimate' ? '📋 見積管理' : '🚚 引越し管理'}
            {viewMode === mode && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </div>

      {/* 月ナビゲーション + サマリー */}
      <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-slate-200 shrink-0">
        <button
          onClick={handlePrevMonth}
          className="text-slate-500 hover:text-slate-800 p-1 rounded transition"
        >
          ◀
        </button>
        <div className="text-center">
          <div className="font-black text-slate-800 text-base">
            {year}年 {month + 1}月
          </div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap justify-center">
            {Object.entries(statusCounts).map(([st, cnt]) => {
              const badge = STATUS_BADGE[st] || {
                bg: 'bg-slate-200',
                text: 'text-slate-600',
              };
              return (
                <span
                  key={st}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                >
                  {st}:{cnt}
                </span>
              );
            })}
            {monthlyAppts.length === 0 && (
              <span className="text-[10px] text-slate-400">案件なし</span>
            )}
          </div>
        </div>
        <button
          onClick={handleNextMonth}
          className="text-slate-500 hover:text-slate-800 p-1 rounded transition"
        >
          ▶
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* スマホ用タブ（カレンダー / 受付登録） */}
        <div className="flex bg-slate-200 shrink-0">
          {(['calendar', 'form'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 py-2 text-xs font-bold transition',
                activeTab === tab
                  ? 'bg-white text-[#003366]'
                  : 'text-slate-500 hover:bg-slate-100',
              ].join(' ')}
            >
              {tab === 'calendar' ? '📅 カレンダー' : '📝 新規受付'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'calendar' ? (
            <CalendarView
              currentMonth={new Date(year, month, 1)}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              appointments={appointments}
              viewMode={viewMode}
              setViewMode={setViewMode}
              formData={{
                estimateDate: selectedDate || '',
                moveDate: selectedDate || '',
              }}
              onDateClick={handleSelectDate}
            />
          ) : (
            <AppointmentForm onSearch={handleSearch} />
          )}
        </div>
      </div>

      {/* 案件リストモーダル */}
      {showListModal && selectedDate && (
        <AppointmentListModal
          date={selectedDate}
          appointments={selectedAppts}
          onClose={() => {
            setShowListModal(false);
            setSelectedDate(null);
          }}
          onNavigateToEstimate={(appt) => {
            setShowListModal(false);
            onStartEstimate(appt);
          }}
          viewMode={viewMode}
        />
      )}

      {/* 設定画面 */}
      {showSettings && (
        <StaffSettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* 検索結果モーダル */}
      {showSearchResult && searchResults !== null && (
        <SearchResultModal
          results={searchResults}
          keyword={searchKeyword}
          onClose={() => setShowSearchResult(false)}
          onSelectDate={(dateStr) => {
            handleSelectDateFromSearch(dateStr);
            setShowSearchResult(false);
          }}
          onStartEstimate={(appt) => {
            setShowSearchResult(false);
            onStartEstimate(appt);
          }}
          onOpenList={(appt) => {
            handleSelectDateFromSearch(
              viewMode === 'moving'
                ? appt.moveDate?.substring(0, 10) || ''
                : appt.estimateDate?.substring(0, 10) ||
                    appt.visitDate?.substring(0, 10) ||
                    ''
            );
            setShowSearchResult(false);
            setShowListModal(true);
          }}
        />
      )}
    </div>
  );
}
