import { createSign } from 'crypto';
import { NextResponse } from 'next/server';
import {
  calculateEstimateTotals,
  calculateLaborTotal,
  calculateTruckTotal,
} from '../../../features/estimate/calculateEstimateTotals';

export const runtime = 'nodejs';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_COPY_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}/copy?supportsAllDrives=true`;
const SHEETS_BATCH_UPDATE_URL = (spreadsheetId: string) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
const SPREADSHEET_URL = (spreadsheetId: string) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

const SHEET_NAME = '見積書';

const CELL_MAP = {
  customerName: 'C6',
  fromAddress: 'C25',
  toAddress: 'C42',
  phone1: 'Y31',
  phone2: 'Y33',
  moveDate: 'H20',
  estimator: 'AE16',
  vehicleCharges: ['AV53', 'AV55', 'AV57', 'AV59'],
  laborCharges: ['AV61', 'AV63'],
  baseTotal: 'AV69',
  baseDiscount: 'AV72',
  discountedBaseTotal: 'AV74',
  serviceTotal: 'AV95',
  otherTotal: 'AV110',
  subtotal: 'AR113',
  tax: 'AV116',
};

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const getPrivateKey = () =>
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const getAccessToken = async () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error('Googleサービスアカウントの環境変数が未設定です。');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPES.join(' '),
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedJwt = `${header}.${claim}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedJwt)
    .sign(privateKey);
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error_description || 'Google認証に失敗しました。');
  }

  return result.access_token as string;
};

const requestGoogleApi = async (
  url: string,
  accessToken: string,
  body: Record<string, unknown>
) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.error?.message || 'Google APIでエラーが発生しました。'
    );
  }

  return result;
};

const buildFileName = (customerName: string) => {
  const safeName = (customerName || '新規')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
  const date = new Date().toISOString().slice(0, 10);
  return `見積書_${safeName}_${date}`;
};

const asRange = (cell: string) => `${SHEET_NAME}!${cell}`;

const summarizeLineTotals = (values: number[], maxLines: number): number[] => {
  const lines = values.slice(0, maxLines);
  while (lines.length < maxLines) lines.push(0);

  if (values.length > maxLines) {
    lines[maxLines - 1] += values
      .slice(maxLines)
      .reduce((sum, value) => sum + value, 0);
  }

  return lines;
};

const valueUpdate = (cell: string, value: string | number) => ({
  range: asRange(cell),
  values: [[value]],
});

export async function POST(request: Request) {
  try {
    const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID;
    if (!templateId) {
      throw new Error('GOOGLE_SHEETS_TEMPLATE_ID が未設定です。');
    }

    const payload = await request.json();
    const customer = payload?.customer || {};
    const trucks = payload?.trucks || [];
    const labors = payload?.labors || [];
    const estimateInput = {
      trucks,
      labors,
      services: payload?.services || [],
      fixedDiscounts: payload?.fixedDiscounts || [],
      discountRate: payload?.discountRate || 0,
    };
    const costs = calculateEstimateTotals(estimateInput);
    const baseTotal = costs.transportTotal + costs.laborTotal;
    const discountedBaseTotal = Math.max(
      0,
      baseTotal - costs.rateDiscountAmount
    );
    const title = buildFileName(customer?.name);
    const accessToken = await getAccessToken();

    const copyBody: Record<string, unknown> = { name: title };
    if (process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID) {
      copyBody.parents = [process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID];
    }

    const copiedFile = await requestGoogleApi(
      DRIVE_COPY_URL(templateId),
      accessToken,
      copyBody
    );
    const spreadsheetId = copiedFile.id as string;

    const vehicleLines = summarizeLineTotals(
      trucks.map((truck: any) => calculateTruckTotal(truck)),
      CELL_MAP.vehicleCharges.length
    );
    const laborLines = summarizeLineTotals(
      labors.map((labor: any) => calculateLaborTotal(labor)),
      CELL_MAP.laborCharges.length
    );

    const data = [
      valueUpdate(CELL_MAP.customerName, customer?.name || ''),
      valueUpdate(CELL_MAP.fromAddress, customer?.fromAddress || ''),
      valueUpdate(CELL_MAP.toAddress, customer?.toAddress || ''),
      valueUpdate(CELL_MAP.phone1, customer?.phone || ''),
      valueUpdate(CELL_MAP.phone2, customer?.phone2 || ''),
      valueUpdate(
        CELL_MAP.moveDate,
        [customer?.moveDate, customer?.moveTime].filter(Boolean).join(' ')
      ),
      valueUpdate(CELL_MAP.estimator, customer?.estimator || ''),
      ...CELL_MAP.vehicleCharges.map((cell, index) =>
        valueUpdate(cell, vehicleLines[index])
      ),
      ...CELL_MAP.laborCharges.map((cell, index) =>
        valueUpdate(cell, laborLines[index])
      ),
      valueUpdate(CELL_MAP.baseTotal, baseTotal),
      valueUpdate(CELL_MAP.baseDiscount, costs.rateDiscountAmount),
      valueUpdate(CELL_MAP.discountedBaseTotal, discountedBaseTotal),
      valueUpdate(CELL_MAP.serviceTotal, costs.serviceTotal),
      valueUpdate(CELL_MAP.otherTotal, 0),
      valueUpdate(CELL_MAP.subtotal, costs.subtotal),
      valueUpdate(CELL_MAP.tax, costs.taxAmount),
    ];

    await requestGoogleApi(SHEETS_BATCH_UPDATE_URL(spreadsheetId), accessToken, {
      valueInputOption: 'USER_ENTERED',
      data,
    });

    return NextResponse.json({
      spreadsheetId,
      spreadsheetUrl: SPREADSHEET_URL(spreadsheetId),
      title,
    });
  } catch (error: any) {
    console.error('Estimate spreadsheet export failed:', error);
    return NextResponse.json(
      {
        message:
          error?.message || 'スプレッドシート見積書の作成に失敗しました。',
      },
      { status: 500 }
    );
  }
}
