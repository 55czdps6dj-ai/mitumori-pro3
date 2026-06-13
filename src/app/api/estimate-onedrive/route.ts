import { readFile } from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import {
  calculateEstimateTotals,
  calculateLaborTotal,
  calculateTruckTotal,
} from '../../../features/estimate/calculateEstimateTotals';

export const runtime = 'nodejs';

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'public',
  'templates',
  'estimate-template.xlsx'
);
const SHEET_NAME = '見積書';
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

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

const toNumber = (value: unknown): number => Number(value || 0);

const getMicrosoftAccessToken = async () => {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft 365連携の環境変数が未設定です。');
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: GRAPH_SCOPE,
        grant_type: 'client_credentials',
      }),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.error_description || 'Microsoft認証に失敗しました。'
    );
  }

  return result.access_token as string;
};

const setCell = (worksheet: ExcelJS.Worksheet, address: string, value: any) => {
  const cell = worksheet.getCell(address);
  cell.value = value === '' || value === undefined ? null : value;
};

const setAmount = (
  worksheet: ExcelJS.Worksheet,
  address: string,
  value: number
) => {
  const cell = worksheet.getCell(address);
  cell.value = toNumber(value);
  cell.numFmt = '#,##0';
};

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

const buildFileName = (customerName: string) => {
  const safeName = (customerName || '新規')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
  const date = new Date().toISOString().slice(0, 10);
  return `見積書_${safeName}_${date}.xlsx`;
};

const encodeOneDrivePath = (filePath: string) =>
  filePath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const buildUploadUrl = (fileName: string) => {
  const userId = process.env.MICROSOFT_ONEDRIVE_USER_ID;
  if (!userId) {
    throw new Error('MICROSOFT_ONEDRIVE_USER_ID が未設定です。');
  }

  const folder = process.env.MICROSOFT_ONEDRIVE_OUTPUT_FOLDER || '見積書';
  const uploadPath = encodeOneDrivePath(`${folder}/${fileName}`);

  return `${GRAPH_BASE_URL}/users/${encodeURIComponent(
    userId
  )}/drive/root:/${uploadPath}:/content`;
};

const buildWorkbookBuffer = async (payload: any) => {
  const workbook = new ExcelJS.Workbook();
  const template = await readFile(TEMPLATE_PATH);
  await workbook.xlsx.load(template);

  const worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    throw new Error('見積書シートが見つかりません。');
  }

  const customer = payload?.customer || {};
  const trucks = payload?.trucks || [];
  const labors = payload?.labors || [];
  const costs = calculateEstimateTotals({
    trucks,
    labors,
    services: payload?.services || [],
    fixedDiscounts: payload?.fixedDiscounts || [],
    discountRate: payload?.discountRate || 0,
  });
  const baseTotal = costs.transportTotal + costs.laborTotal;
  const discountedBaseTotal = Math.max(
    0,
    baseTotal - costs.rateDiscountAmount
  );

  setCell(worksheet, CELL_MAP.customerName, customer?.name || '');
  setCell(worksheet, CELL_MAP.fromAddress, customer?.fromAddress || '');
  setCell(worksheet, CELL_MAP.toAddress, customer?.toAddress || '');
  setCell(worksheet, CELL_MAP.phone1, customer?.phone || '');
  setCell(worksheet, CELL_MAP.phone2, customer?.phone2 || '');
  setCell(
    worksheet,
    CELL_MAP.moveDate,
    [customer?.moveDate, customer?.moveTime].filter(Boolean).join(' ')
  );
  setCell(worksheet, CELL_MAP.estimator, customer?.estimator || '');

  const vehicleLines = summarizeLineTotals(
    trucks.map((truck: any) => calculateTruckTotal(truck)),
    CELL_MAP.vehicleCharges.length
  );
  CELL_MAP.vehicleCharges.forEach((address, index) => {
    setAmount(worksheet, address, vehicleLines[index]);
  });

  const laborLines = summarizeLineTotals(
    labors.map((labor: any) => calculateLaborTotal(labor)),
    CELL_MAP.laborCharges.length
  );
  CELL_MAP.laborCharges.forEach((address, index) => {
    setAmount(worksheet, address, laborLines[index]);
  });

  setAmount(worksheet, CELL_MAP.baseTotal, baseTotal);
  setAmount(worksheet, CELL_MAP.baseDiscount, costs.rateDiscountAmount);
  setAmount(worksheet, CELL_MAP.discountedBaseTotal, discountedBaseTotal);
  setAmount(worksheet, CELL_MAP.serviceTotal, costs.serviceTotal);
  setAmount(worksheet, CELL_MAP.otherTotal, 0);
  setAmount(worksheet, CELL_MAP.subtotal, costs.subtotal);
  setAmount(worksheet, CELL_MAP.tax, costs.taxAmount);

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const fileName = buildFileName(payload?.customer?.name);
    const buffer = await buildWorkbookBuffer(payload);
    const accessToken = await getMicrosoftAccessToken();

    const uploadResponse = await fetch(buildUploadUrl(fileName), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: buffer,
    });

    const result = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(
        result?.error?.message || 'OneDriveへの保存に失敗しました。'
      );
    }

    return NextResponse.json({
      fileName,
      webUrl: result.webUrl,
      itemId: result.id,
    });
  } catch (error: any) {
    console.error('Estimate OneDrive export failed:', error);
    return NextResponse.json(
      {
        message: error?.message || 'OneDrive見積書の作成に失敗しました。',
      },
      { status: 500 }
    );
  }
}
