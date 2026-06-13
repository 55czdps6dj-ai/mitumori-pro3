// @ts-nocheck
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  calculateLaborTotal,
  calculateTaxAmount,
  calculateTruckTotal,
} from './calculateEstimateTotals';

const TEMPLATE_PATH = '/templates/estimate-template.xlsx';
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

const toNumber = (value: unknown): number => Number(value || 0);

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

const summarizeLineTotals = (
  values: number[],
  maxLines: number
): number[] => {
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

export const exportEstimateWorkbook = async (store: any) => {
  const response = await fetch(TEMPLATE_PATH);
  if (!response.ok) {
    throw new Error('見積書テンプレートを読み込めませんでした。');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.arrayBuffer());

  const worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    throw new Error('見積書シートが見つかりません。');
  }

  const { customer, trucks, labors, costs } = store;
  const transportTotal = toNumber(costs?.transportTotal);
  const laborTotal = toNumber(costs?.laborTotal);
  const baseTotal = transportTotal + laborTotal;
  const baseDiscount = toNumber(costs?.rateDiscountAmount);
  const discountedBaseTotal = Math.max(0, baseTotal - baseDiscount);
  const serviceTotal = toNumber(costs?.serviceTotal);
  const subtotal = toNumber(costs?.subtotal);
  const tax = calculateTaxAmount(subtotal);

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
    (trucks || []).map((truck: any) => calculateTruckTotal(truck)),
    CELL_MAP.vehicleCharges.length
  );
  CELL_MAP.vehicleCharges.forEach((address, index) => {
    setAmount(worksheet, address, vehicleLines[index]);
  });

  const laborLines = summarizeLineTotals(
    (labors || []).map((labor: any) => calculateLaborTotal(labor)),
    CELL_MAP.laborCharges.length
  );
  CELL_MAP.laborCharges.forEach((address, index) => {
    setAmount(worksheet, address, laborLines[index]);
  });

  setAmount(worksheet, CELL_MAP.baseTotal, baseTotal);
  setAmount(worksheet, CELL_MAP.baseDiscount, baseDiscount);
  setAmount(worksheet, CELL_MAP.discountedBaseTotal, discountedBaseTotal);
  setAmount(worksheet, CELL_MAP.serviceTotal, serviceTotal);
  setAmount(worksheet, CELL_MAP.otherTotal, 0);
  setAmount(worksheet, CELL_MAP.subtotal, subtotal);
  setAmount(worksheet, CELL_MAP.tax, tax);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    buildFileName(customer?.name)
  );

  return undefined;
};
