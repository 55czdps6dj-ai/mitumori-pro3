export type EstimateCosts = {
  transportTotal: number;
  laborTotal: number;
  rateDiscountAmount: number;
  serviceTotal: number;
  fixedDiscountAmount: number;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalWithTax: number;
  currentMultiplier: number;
};

type TruckLike = {
  price?: number | string;
  quantity?: number | string;
  distance?: number | string;
  distanceRate?: number | string;
  hours?: number | string;
  hourRate?: number | string;
};

type LaborLike = {
  type?: string;
  unitPrice?: number | string;
  staffCount?: number | string;
  hours?: number | string;
};

type PriceQuantityLike = {
  price?: number | string;
  unitPrice?: number | string;
  quantity?: number | string;
};

export type EstimateCalculationInput = {
  trucks?: TruckLike[];
  labors?: LaborLike[];
  services?: PriceQuantityLike[];
  fixedDiscounts?: PriceQuantityLike[];
  discountRate?: number | string;
};

const toNumber = (value: unknown): number => Number(value || 0);

export const calculateTruckTotal = (truck: TruckLike): number => {
  const distanceOverage = Math.max(toNumber(truck.distance) - 100, 0);
  const hourOverage = Math.max(toNumber(truck.hours) - 8, 0);

  return Math.round(
    toNumber(truck.price) * toNumber(truck.quantity || 1) +
      distanceOverage * toNumber(truck.distanceRate) +
      hourOverage * toNumber(truck.hourRate)
  );
};

export const calculateLaborTotal = (labor: LaborLike): number => {
  const base = toNumber(labor.unitPrice) * toNumber(labor.staffCount || 1);
  const lineBase =
    labor.type === 'hourly' ? base * toNumber(labor.hours || 1) : base;
  return Math.round(lineBase);
};

export const calculateLineItemsTotal = (
  items: PriceQuantityLike[] = [],
  priceKey: 'price' | 'unitPrice' = 'price'
): number =>
  items.reduce(
    (sum, item) =>
      sum + toNumber(item[priceKey]) * toNumber(item.quantity || 1),
    0
  );

export const calculateTaxAmount = (subtotal: number): number =>
  Math.round(Math.max(0, subtotal) * 0.1);

export const calculateTotalWithTax = (subtotal: number): number =>
  Math.max(0, subtotal) + calculateTaxAmount(subtotal);

export const calculateEstimateTotals = (
  input: EstimateCalculationInput
): EstimateCosts => {
  const transportTotal = (input.trucks || []).reduce(
    (sum, truck) => sum + calculateTruckTotal(truck),
    0
  );

  const laborTotal = (input.labors || []).reduce(
    (sum, labor) => sum + calculateLaborTotal(labor),
    0
  );

  const serviceTotal = calculateLineItemsTotal(input.services || []);
  const baseForDiscount = transportTotal + laborTotal;
  const rateDiscountAmount = Math.round(
    baseForDiscount * (toNumber(input.discountRate) / 100)
  );
  const fixedDiscountAmount = calculateLineItemsTotal(
    input.fixedDiscounts || []
  );
  const subtotal = Math.max(
    0,
    baseForDiscount -
      rateDiscountAmount +
      serviceTotal -
      fixedDiscountAmount
  );

  return {
    transportTotal,
    laborTotal,
    rateDiscountAmount,
    serviceTotal,
    fixedDiscountAmount,
    subtotal,
    totalDiscount: rateDiscountAmount + fixedDiscountAmount,
    taxAmount: calculateTaxAmount(subtotal),
    totalWithTax: calculateTotalWithTax(subtotal),
    currentMultiplier: 1,
  };
};
