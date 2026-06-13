type EstimateOneDrivePayload = {
  customer: any;
  trucks: any[];
  labors: any[];
  services: any[];
  fixedDiscounts: any[];
  discountRate: number;
};

const buildEstimatePayload = (store: any): EstimateOneDrivePayload => ({
  customer: store.customer || {},
  trucks: store.trucks || [],
  labors: store.labors || [],
  services: store.services || [],
  fixedDiscounts: store.fixedDiscounts || [],
  discountRate: Number(store.discountRate || 0),
});

const getFileNameFromContentDisposition = (header: string | null) => {
  const match = header?.match(/filename\*=UTF-8''([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '見積書.xlsx';
};

const downloadEstimateWorkbook = async (payload: EstimateOneDrivePayload) => {
  const response = await fetch('/api/estimate-workbook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.message || 'Excel見積書の作成に失敗しました。');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getFileNameFromContentDisposition(
    response.headers.get('Content-Disposition')
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    fileName: link.download,
    webUrl: '',
    itemId: '',
    mode: 'download' as const,
  };
};

export const createEstimateOneDriveWorkbook = async (store: any) => {
  const payload = buildEstimatePayload(store);
  const response = await fetch('/api/estimate-onedrive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      result?.message?.includes('環境変数が未設定') ||
      result?.message?.includes('MICROSOFT_')
    ) {
      return downloadEstimateWorkbook(payload);
    }

    throw new Error(
      result?.message || 'OneDrive見積書の作成に失敗しました。'
    );
  }

  return result as {
    fileName: string;
    webUrl: string;
    itemId: string;
    mode?: 'onedrive' | 'download';
  };
};
