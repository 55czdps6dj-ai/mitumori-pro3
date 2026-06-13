type EstimateSpreadsheetPayload = {
  customer: any;
  trucks: any[];
  labors: any[];
  services: any[];
  fixedDiscounts: any[];
  discountRate: number;
};

const buildEstimatePayload = (store: any): EstimateSpreadsheetPayload => ({
  customer: store.customer || {},
  trucks: store.trucks || [],
  labors: store.labors || [],
  services: store.services || [],
  fixedDiscounts: store.fixedDiscounts || [],
  discountRate: Number(store.discountRate || 0),
});

export const createEstimateSpreadsheet = async (store: any) => {
  const response = await fetch('/api/estimate-spreadsheet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEstimatePayload(store)),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message || 'スプレッドシート見積書の作成に失敗しました。'
    );
  }

  return result as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
  };
};
