// @ts-nocheck
import React, { useMemo } from 'react';

export const CalendarView = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  appointments = [],
  viewMode,
  setViewMode,
  formData,
  onDateClick,
  getTruckStock = () => 0,
}: any) => {
  const { firstDay, days, year, month } = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    return {
      firstDay: new Date(y, m, 1).getDay(),
      days: new Date(y, m + 1, 0).getDate(),
      year: y,
      month: m,
    };
  }, [currentMonth]);

  const calendarDays = Array.from({ length: firstDay + days }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  // ステータスごとのバッジ設定
  const STATUS_BADGE = {
    見積済み: { bg: 'bg-blue-600 border-blue-700 text-white', label: '済' },
    成約: { bg: 'bg-emerald-500 border-emerald-600 text-white', label: '約' },
    訪問日確定: {
      bg: 'bg-yellow-400 border-yellow-500 text-white',
      label: '訪',
    },
    TEL待ち: { bg: 'bg-orange-400 border-orange-500 text-white', label: 'TEL' },
    キャンセル: { bg: 'bg-red-400 border-red-500 text-white', label: '×' },
    未対応: { bg: 'bg-white border-slate-100 text-slate-500', label: '未' },
  };

  return (
    <main className="flex-1 p-8 flex flex-col overflow-hidden relative">
      <header className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-6">
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border">
            <button
              onClick={onPrevMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-all text-[#003366] font-bold text-xl"
            >
              〈
            </button>
            <button
              onClick={onNextMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-all text-[#003366] font-bold text-xl"
            >
              〉
            </button>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#003366]">
              {year}年 {month + 1}月
            </h3>
            <span
              className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black inline-block ${
                viewMode === 'estimate'
                  ? 'bg-[#003366] text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {viewMode === 'estimate'
                ? '📝 見積スケジュール'
                : '🚛 引越空き状況'}
            </span>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border">
          <button
            onClick={() => setViewMode('estimate')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${
              viewMode === 'estimate'
                ? 'bg-[#003366] text-white shadow-lg'
                : 'text-slate-400'
            }`}
          >
            📝 見積
          </button>
          <button
            onClick={() => setViewMode('move')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${
              viewMode === 'move'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400'
            }`}
          >
            🚛 引越
          </button>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-slate-50 border-b">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div
              key={d}
              className={`p-4 text-center font-black text-[10px] ${
                i === 0
                  ? 'text-red-500'
                  : i === 6
                  ? 'text-blue-500'
                  : 'text-slate-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y border-b">
          {calendarDays.map((day, i) => {
            if (!day)
              return <div key={`empty-${i}`} className="bg-slate-50/20" />;

            const dateStr = `${year}-${String(month + 1).padStart(
              2,
              '0'
            )}-${String(day).padStart(2, '0')}`;

            const dayAppts = (appointments || []).filter((a) =>
              viewMode === 'estimate'
                ? a.estimateDate === dateStr
                : a.moveDate === dateStr
            );

            const contractedAppts = dayAppts.filter((a) => a.status === '成約');
            const otherAppts = dayAppts.filter((a) => a.status !== '成約');

            const isSelected =
              viewMode === 'estimate'
                ? formData.estimateDate === dateStr
                : formData.moveDate === dateStr;

            return (
              <div
                key={day}
                onClick={() => onDateClick(dateStr)}
                className={`relative p-1 flex flex-col cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 ring-4 ring-inset ring-blue-100'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <span className="text-[10px] font-black text-slate-300 ml-1">
                  {day}
                </span>

                {/* ── 見積タブ ── */}
                {viewMode === 'estimate' && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center w-full px-1">
                      {dayAppts.length > 0 && (
                        <div className="text-2xl font-black text-[#003366] leading-none mb-1">
                          {dayAppts.length}
                        </div>
                      )}
                      <div className="space-y-0.5 max-h-[60px] overflow-hidden">
                        {dayAppts.slice(0, 4).map((a, idx) => {
                          const badge =
                            STATUS_BADGE[a.status] || STATUS_BADGE['未対応'];
                          return (
                            <div
                              key={idx}
                              className={`text-[7px] font-bold border rounded py-0.5 px-1 truncate flex items-center justify-between gap-1 shadow-sm ${badge.bg}`}
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className="opacity-80">
                                  {a.displayTime || '設定無'}
                                </span>
                                {a.name}
                              </span>
                              <span
                                className={`text-[6px] px-0.5 rounded-sm shrink-0 font-black ${
                                  a.status === '未対応'
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-white/80 text-current'
                                }`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          );
                        })}
                        {dayAppts.length > 4 && (
                          <div className="text-[6px] text-slate-300 font-black text-center">
                            +{dayAppts.length - 4}件
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 引越タブ ── */}
                {viewMode === 'move' && (
                  <div className="flex-1 flex flex-col justify-start gap-0.5 pt-0.5 overflow-hidden">
                    {dayAppts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[9px] text-slate-200 font-black">
                          −
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* 成約案件 */}
                        {contractedAppts.slice(0, 3).map((a, idx) => {
                          const trucks = a.estimateData?.trucks || [];
                          const truckSummary =
                            trucks.length > 0
                              ? trucks
                                  .map((t) => `${t.type}×${t.quantity}`)
                                  .join(' ')
                              : null;
                          return (
                            <div
                              key={idx}
                              className="bg-emerald-500 rounded-md px-1 py-0.5 text-white shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-0.5">
                                <span className="text-[7px] font-black truncate">
                                  {a.moveTime && (
                                    <span className="opacity-80 mr-0.5">
                                      {a.moveTime}
                                    </span>
                                  )}
                                  {a.name}
                                </span>
                                <span className="text-[6px] bg-white text-emerald-600 px-0.5 rounded-sm font-black shrink-0">
                                  成約
                                </span>
                              </div>
                              {truckSummary && (
                                <div className="text-[6px] opacity-80 font-bold truncate">
                                  🚛 {truckSummary}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 成約以外 */}
                        {otherAppts.slice(0, 2).map((a, idx) => (
                          <div
                            key={idx}
                            className={`rounded px-1 py-0.5 text-[6px] font-bold truncate ${
                              a.status === '見積済み'
                                ? 'bg-blue-100 text-blue-700'
                                : a.status === 'TEL待ち'
                                ? 'bg-orange-100 text-orange-600'
                                : a.status === '訪問日確定'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {a.name}
                            <span className="ml-0.5 opacity-60">
                              ({a.status})
                            </span>
                          </div>
                        ))}

                        {dayAppts.length > 4 && (
                          <div className="text-[6px] text-slate-300 font-black text-center">
                            +{dayAppts.length - 4}件
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};
