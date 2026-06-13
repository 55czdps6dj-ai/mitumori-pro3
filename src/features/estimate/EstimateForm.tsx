// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useReceptionStore } from '../reception/useReceptionStore';

interface EstimateFormProps {
  appointmentId: string;
  onBack?: () => void;
}

export default function EstimateForm({
  appointmentId,
  onBack,
}: EstimateFormProps) {
  // Storeから関数とデータを取得
  const { appointments, updateFullEstimate } = useReceptionStore();

  // 対象の案件データを特定
  const targetAppt = appointments.find((a) => a.id === appointmentId);

  // 1. 家財・計算用ステート
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [total, setTotal] = useState<number | null>(null);

  // 2. 顧客情報編集用ステート
  const [customerFields, setCustomerFields] = useState({
    name: '',
    phone: '',
    fromAddress: '',
    toAddress: '',
  });

  // DBからデータを復元する (マウント時)
  useEffect(() => {
    if (targetAppt) {
      setCustomerFields({
        name: targetAppt.name || '',
        phone: targetAppt.phone || '',
        fromAddress: targetAppt.fromAddress || '',
        toAddress: targetAppt.toAddress || '',
      });

      if (targetAppt.estimateData) {
        setPrice(targetAppt.estimateData.price || '');
        setQuantity(targetAppt.estimateData.quantity || '');
        if (targetAppt.estimateData.price && targetAppt.estimateData.quantity) {
          setTotal(
            Number(targetAppt.estimateData.price) *
              Number(targetAppt.estimateData.quantity)
          );
        }
      }
    }
  }, [targetAppt]);

  // 計算ロジック
  const calculate = () => {
    const result = Number(price) * Number(quantity);
    setTotal(result);
  };

  // 顧客情報と家財データをまとめてSupabaseに保存
  const handleSaveAll = async () => {
    try {
      const estimateSnapshot = {
        price: price,
        quantity: quantity,
        total: total,
        updatedAt: new Date().toISOString(),
      };

      await updateFullEstimate(appointmentId, customerFields, estimateSnapshot);
      alert('顧客情報と見積データを保存しました！');
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました。');
    }
  };

  if (!targetAppt) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="bg-slate-50 min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* 顧客情報セクション */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-slate-400 mb-4 uppercase">
            顧客情報（編集可）
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="氏名"
              value={customerFields.name}
              onChange={(e) =>
                setCustomerFields({ ...customerFields, name: e.target.value })
              }
              className="w-full border-2 border-slate-100 p-2 rounded-xl font-bold focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="電話番号"
              value={customerFields.phone}
              onChange={(e) =>
                setCustomerFields({ ...customerFields, phone: e.target.value })
              }
              className="w-full border-2 border-slate-100 p-2 rounded-xl font-bold focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="引越元"
              value={customerFields.fromAddress}
              onChange={(e) =>
                setCustomerFields({
                  ...customerFields,
                  fromAddress: e.target.value,
                })
              }
              className="w-full border-2 border-slate-100 p-2 rounded-xl font-bold focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 家財計算セクション */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-slate-400 mb-4 uppercase">
            家財見積計算
          </h2>
          <div className="mb-4">
            <label className="block mb-1 text-xs font-bold text-slate-500">
              単価
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border-2 border-slate-100 p-2 rounded-xl font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-xs font-bold text-slate-500">
              数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border-2 border-slate-100 p-2 rounded-xl font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={calculate}
            className="bg-slate-800 text-white px-4 py-3 rounded-xl w-full font-black hover:bg-slate-700 transition-all mb-4"
          >
            計算する
          </button>

          {total !== null && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-center">
              <span className="text-blue-900 text-xs font-bold block mb-1">
                見積合計
              </span>
              <span className="text-2xl font-black text-blue-600">
                ¥{total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 bg-slate-200 text-slate-600 p-4 rounded-2xl font-black"
            >
              戻る
            </button>
          )}
          <button
            onClick={handleSaveAll}
            className="flex-[2] bg-green-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-600 transition-all"
          >
            DBに一括保存
          </button>
        </div>
      </div>
    </div>
  );
}
