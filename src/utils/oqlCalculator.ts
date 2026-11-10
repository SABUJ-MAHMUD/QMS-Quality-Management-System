import { InspectionReport, DefectGroup, InspectionDefect } from '../types';

/**
 * Calculates single report OQL percentage based on official BESTSELLER formula:
 * OQL (%) = (Total Defects / Total Inspected Quantity) * 100
 * where Total Defects = Critical + Major + Minor
 */
export function calculateReportOql(
  totalDefects: number,
  inspectedQuantity: number,
  decimals: number = 2
): number {
  if (!inspectedQuantity || inspectedQuantity <= 0) {
    return 0;
  }
  const oql = (totalDefects / inspectedQuantity) * 100;
  return Number(oql.toFixed(decimals));
}

/**
 * Calculates Aggregated OQL across multiple inspection reports:
 * Aggregated OQL (%) = (Sum of Total Defects / Sum of Total Inspected Quantity) * 100
 * IMPORTANT: Never calculate aggregated OQL by taking a simple average of individual inspection OQLs.
 */
export function calculateAggregatedOql(
  reports: Array<{ totalDefectQuantity: number; inspectedQuantity: number }>,
  decimals: number = 2
): number {
  if (!reports || reports.length === 0) return 0;

  const totalDefects = reports.reduce((sum, r) => sum + (Number(r.totalDefectQuantity) || 0), 0);
  const totalInspected = reports.reduce((sum, r) => sum + (Number(r.inspectedQuantity) || 0), 0);

  if (totalInspected <= 0) return 0;
  const aggregated = (totalDefects / totalInspected) * 100;
  return Number(aggregated.toFixed(decimals));
}

/**
 * Calculates Defect Reduction percentage for CAPA Monitoring:
 * Reduction (%) = ((Previous Defect Qty - Current Defect Qty) / Previous Defect Qty) * 100
 * Returns null if Previous Defect Qty is <= 0.
 */
export function calculateReductionPercentage(
  previousDefectQty: number,
  currentDefectQty: number,
  decimals: number = 1
): number | null {
  if (previousDefectQty === undefined || previousDefectQty === null || previousDefectQty <= 0) {
    return null;
  }
  const reduction = ((previousDefectQty - currentDefectQty) / previousDefectQty) * 100;
  return Number(reduction.toFixed(decimals));
}

/**
 * Determines Financial Year label for a given date string (YYYY-MM-DD)
 * Default financial year begins in August (month index 8) and ends in July.
 * E.g., Date in October 2026 -> FY26/27 (Aug 2026 - Jul 2027)
 * E.g., Date in May 2026 -> FY25/26 (Aug 2025 - Jul 2026)
 */
export function getFinancialYear(dateStr: string, startMonth: number = 8): string {
  if (!dateStr) return 'FY26/27';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'FY26/27';

  const month = d.getMonth() + 1; // 1 to 12
  const year = d.getFullYear();

  if (month >= startMonth) {
    const y1 = year % 100;
    const y2 = (year + 1) % 100;
    return `FY${y1.toString().padStart(2, '0')}/${y2.toString().padStart(2, '0')}`;
  } else {
    const y1 = (year - 1) % 100;
    const y2 = year % 100;
    return `FY${y1.toString().padStart(2, '0')}/${y2.toString().padStart(2, '0')}`;
  }
}

/**
 * Computes Pareto distribution for defect analysis:
 * Sorts defects descending by quantity, computes percentage and cumulative percentage.
 */
export interface ParetoItem {
  name: string;
  groupName: string;
  quantity: number;
  percentage: number;
  cumulativePercentage: number;
}

export function computeParetoAnalysis(
  defects: Array<{ standardDefectName?: string; originalDefectName?: string; defectQuantity: number; defectGroupId?: string }>,
  defectGroups: DefectGroup[] = []
): ParetoItem[] {
  const groupMap = new Map(defectGroups.map((g) => [g.id, g.groupName]));
  const itemMap = new Map<string, { quantity: number; groupName: string }>();

  for (const d of defects) {
    const name = d.standardDefectName || d.originalDefectName || 'Unspecified Defect';
    const groupName = (d.defectGroupId && groupMap.get(d.defectGroupId)) || 'General';
    const current = itemMap.get(name) || { quantity: 0, groupName };
    current.quantity += Number(d.defectQuantity) || 0;
    itemMap.set(name, current);
  }

  const list: Array<{ name: string; groupName: string; quantity: number }> = [];
  itemMap.forEach((val, name) => {
    list.push({ name, groupName: val.groupName, quantity: val.quantity });
  });

  list.sort((a, b) => b.quantity - a.quantity);

  const totalQty = list.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty === 0) return [];

  let runningTotal = 0;
  return list.map((item) => {
    runningTotal += item.quantity;
    const percentage = Number(((item.quantity / totalQty) * 100).toFixed(1));
    const cumulativePercentage = Number(((runningTotal / totalQty) * 100).toFixed(1));
    return {
      name: item.name,
      groupName: item.groupName,
      quantity: item.quantity,
      percentage,
      cumulativePercentage: Math.min(100, cumulativePercentage),
    };
  });
}

/**
 * Filter reports according to global filters
 */
export function filterReports(
  reports: InspectionReport[],
  filters: {
    buyer?: string;
    financialYear?: string;
    month?: string;
    dateFrom?: string;
    dateTo?: string;
    orderNumber?: string;
    styleNumber?: string;
    defectGroup?: string;
    defectSeverity?: string;
    inspectionResult?: string;
    searchQuery?: string;
  },
  fyStartMonth: number = 8
): InspectionReport[] {
  return reports.filter((report) => {
    if (filters.buyer && filters.buyer !== 'ALL' && report.buyer.toLowerCase() !== filters.buyer.toLowerCase()) {
      return false;
    }

    if (filters.financialYear && filters.financialYear !== 'ALL') {
      const repFy = getFinancialYear(report.inspectionDate, fyStartMonth);
      if (repFy !== filters.financialYear) return false;
    }

    if (filters.month && filters.month !== 'ALL') {
      // Month format: 'YYYY-MM'
      if (!report.inspectionDate.startsWith(filters.month)) return false;
    }

    if (filters.dateFrom && report.inspectionDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && report.inspectionDate > filters.dateTo) {
      return false;
    }

    if (filters.orderNumber && !report.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
      return false;
    }

    if (filters.styleNumber && !report.styleNumber.toLowerCase().includes(filters.styleNumber.toLowerCase())) {
      return false;
    }

    if (filters.inspectionResult && filters.inspectionResult !== 'ALL' && report.inspectionResult !== filters.inspectionResult) {
      return false;
    }

    if (filters.defectSeverity && filters.defectSeverity !== 'ALL') {
      const hasSeverity = report.defects?.some((d) => d.severity === filters.defectSeverity);
      if (!hasSeverity) return false;
    }

    if (filters.defectGroup && filters.defectGroup !== 'ALL') {
      const hasGroup = report.defects?.some((d) => d.defectGroupId === filters.defectGroup);
      if (!hasGroup) return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        report.reportNumber.toLowerCase().includes(q) ||
        report.orderNumber.toLowerCase().includes(q) ||
        report.styleNumber.toLowerCase().includes(q) ||
        report.buyer.toLowerCase().includes(q) ||
        report.productDescription.toLowerCase().includes(q) ||
        report.defects?.some(
          (d) =>
            d.standardDefectName.toLowerCase().includes(q) ||
            d.originalDefectName.toLowerCase().includes(q)
        );
      if (!match) return false;
    }

    return true;
  });
}
