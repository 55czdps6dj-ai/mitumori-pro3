// @ts-nocheck
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

/**
 * DBの構造とアプリ内の命名規約を変換するマッパー関数
 */
const mapToApp = (item) => ({
  ...item,
  id: item?.id,
  name: item?.name || '名称未設定',
  phone: item?.phone || '',
  status: item?.status || '未対応',
  estimateDate: item?.estimate_date,
  estimateSlot: item?.estimate_slot,
  estimateTime: item?.estimate_time || '',
  estimateTimeMode: item?.estimate_time_mode || 'slot',
  moveDate: item?.move_date,
  moveTime: item?.move_time,
  fromAddress: item?.from_address || '',
  fromEV: item?.from_ev,
  toAddress: item?.to_address || '',
  toEV: item?.to_ev,
  truckType: item?.truck_type,
  estimateData: item?.estimate_data || {},
});

export const useReceptionStore = create((set, get) => ({
  appointments: [],
  loading: false,

  /**
   * 案件一覧の取得
   */
  fetchAppointments: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ appointments: (data || []).filter(Boolean).map(mapToApp) });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * 新規案件の追加
   */
  addAppointment: async (newAppt) => {
    try {
      const insertData = {
        name: newAppt.name || '名称未設定',
        phone: newAppt.phone || '',
        estimate_date: newAppt.estimateDate || null,
        estimate_slot: newAppt.estimateSlot || null,
        estimate_time: newAppt.estimateTime || '',
        estimate_time_mode: newAppt.estimateTimeMode || 'slot',
        move_date: newAppt.moveDate || null,
        move_time: newAppt.moveTime || null,
        from_address: newAppt.fromAddress || '',
        from_ev: newAppt.fromEV ?? true,
        to_address: newAppt.toAddress || '',
        to_ev: newAppt.toEV ?? true,
        status: '未対応',
        truck_type: '未確定',
        notes: newAppt.notes || '',
        estimate_data: {},
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([insertData])
        .select();

      if (error) throw error;

      const addedItem = mapToApp(data[0]);
      set((state) => ({ appointments: [addedItem, ...state.appointments] }));
      return addedItem;
    } catch (error) {
      console.error('Add error:', error);
      throw error;
    }
  },

  /**
   * 顧客情報の簡易更新（受付画面からの編集）
   */
  updateAppointment: async (id, fields) => {
    try {
      // キャメルケース → スネークケース変換
      const dbFields = {};
      if (fields.name !== undefined) dbFields.name = fields.name;
      if (fields.phone !== undefined) dbFields.phone = fields.phone;
      if (fields.fromAddress !== undefined)
        dbFields.from_address = fields.fromAddress;
      if (fields.toAddress !== undefined)
        dbFields.to_address = fields.toAddress;
      if (fields.notes !== undefined) dbFields.notes = fields.notes;
      if (fields.status !== undefined) dbFields.status = fields.status;
      if (fields.estimateDate !== undefined)
        dbFields.estimate_date = fields.estimateDate || null;
      if (fields.estimateSlot !== undefined)
        dbFields.estimate_slot = fields.estimateSlot || null;
      if (fields.estimateTime !== undefined)
        dbFields.estimate_time = fields.estimateTime || '';
      if (fields.estimateTimeMode !== undefined)
        dbFields.estimate_time_mode = fields.estimateTimeMode || 'slot';
      if (fields.moveDate !== undefined)
        dbFields.move_date = fields.moveDate || null;
      if (fields.moveTime != undefined)
        dbFields.move_time = fields.moveTime || null;
      if (fields.truckType !== undefined)
        dbFields.truck_type = fields.truckType;

      const { error } = await supabase
        .from('appointments')
        .update(dbFields)
        .eq('id', id);

      if (error) throw error;

      // ローカル状態も更新
      set((state) => ({
        appointments: state.appointments.map((appt) =>
          appt.id === id ? { ...appt, ...fields } : appt
        ),
      }));
    } catch (error) {
      console.error('UpdateAppointment error:', error);
      alert('更新に失敗しました。');
      throw error;
    }
  },

  /**
   * 見積情報の更新 (保存ボタン押下時のメイン処理)
   */
  updateFullEstimate: async (id, updatedFields, estimateSnapshot) => {
    if (!id) {
      console.error('❌ IDが不足しています');
      throw new Error('IDが不足しています');
    }

    if (!isSupabaseConfigured) {
      const configError =
        '【システムエラー】Supabaseの接続情報（URL/KEY）が読み込めていません。.env.local ファイルを確認してください。';
      alert(configError);
      throw new Error(configError);
    }

    const currentAppt = get().appointments.find((a) => a.id === id);

    const currentStatus = currentAppt?.status || '未対応';
    const nextStatus = ['成約', 'キャンセル'].includes(currentStatus)
      ? currentStatus
      : '見積済み';


    // DB送信データの構築
    const dbUpdate = {
      name: updatedFields.name,
      phone: updatedFields.phone,
      from_address: updatedFields.fromAddress,
      to_address: updatedFields.toAddress,
      from_ev: updatedFields.fromEV ?? currentAppt?.from_ev ?? true,
      to_ev: updatedFields.toEV ?? currentAppt?.to_ev ?? true,
      move_date: updatedFields.moveDate || null,
      move_time: updatedFields.moveTime || null,
      estimate_data: estimateSnapshot,
      status: nextStatus,
    };

    try {
      console.log(`📤 Supabase通信開始 [ID: ${id}]`, dbUpdate);

      const { error, status } = await supabase
        .from('appointments')
        .update(dbUpdate)
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase詳細エラー:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: status,
        });
        throw new Error(`DB更新エラー: ${error.message}`);
      }

      // ローカル状態（Zustand）を更新
      set((state) => ({
        appointments: state.appointments.map((appt) =>
          appt.id === id
            ? {
                ...appt,
                ...updatedFields,
                estimateData: estimateSnapshot,
                status: nextStatus,
              }
            : appt
        ),
      }));

      console.log('✅ 保存成功！');
    } catch (error) {
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        const netErrorMsg =
          '【通信失敗】サーバーに接続できません。\n\n' +
          '原因の可能性があります：\n' +
          '・インターネット接続が不安定\n' +
          '・VPNや社内プロキシによる遮断\n' +
          '・広告ブロック拡張機能の影響\n\n' +
          '一度、スマホのテザリング等で試してみてください。';
        console.error('💥 ネットワーク遮断:', error);
        alert(netErrorMsg);
      } else {
        console.error('UpdateFullEstimate failed:', error);
        alert(`保存に失敗しました: ${error.message}`);
      }
      throw error;
    }
  },

  /**
   * 案件の削除
   */
  deleteAppointment: async (id) => {
    if (!confirm('本当にこの案件を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        appointments: state.appointments.filter((appt) => appt.id !== id),
      }));
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました。');
    }
  },

  /**
   * トラック在庫（空き）状況の取得
   */
  getTruckStock: (date, type) => {
    const total = { '2t': 4, '3t': 3, '4t': 1 }[type] || 0;
    const reserved = (get().appointments || []).filter(
      (a) => a.moveDate === date && a.truckType === type && a.status === '成約'
    ).length;
    return total - reserved;
  },
}));
