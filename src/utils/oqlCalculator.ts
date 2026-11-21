import { InspectionReport, DefectGroup, ReportSource } from '../types';
import { MASTER_DEFECT_23_CATEGORIES, resolveDefectAccurate } from '../data/defectMasterData';

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
 * Calculates Inspection Pass Rate (%) from inspectionResult === 'PASSED':
 * Pass Rate (%) = (Passed Reports Count / Total Reports Count) * 100
 */
export function calculatePassRate(
  reports: Array<{ inspectionResult?: string }>,
  decimals: number = 1
): { passRate: number; passedCount: number; totalCount: number } {
  const totalCount = reports?.length || 0;
  if (totalCount === 0) {
    return { passRate: 0, passedCount: 0, totalCount: 0 };
  }
  const passedCount = reports.filter((r) => (r.inspectionResult || '').toUpperCase() === 'PASSED').length;
  const passRate = Number(((passedCount / totalCount) * 100).toFixed(decimals));
  return { passRate, passedCount, totalCount };
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
 * Normalizes floor identifiers (e.g., "SEW-01", "sew 1", "SEW1" -> "SEW-1").
 */
export function normalizeFloorName(rawFloor?: string): string {
  const clean = (rawFloor || '').trim().toUpperCase().replace(/[_\s]+/g, '-');
  if (!clean) return 'SEW-1';
  const sewMatch = clean.match(/^SEW-?0*(\d+)([A-Z]*)$/);
  if (sewMatch) {
    return `SEW-${sewMatch[1]}${sewMatch[2] || ''}`;
  }
  return clean;
}

/**
 * Detects whether a report belongs to AQC (Factory Self-Audit: "Inspection report, AQC Final:" / "AQC Inline:")
 * or BSQC (BESTSELLER Buyer QC: "Inspection report, Final" / "Inline").
 */
export function detectReportSource(
  text?: string,
  fileName?: string,
  explicitSource?: ReportSource
): ReportSource {
  if (explicitSource === 'AQC' || explicitSource === 'BSQC') {
    return explicitSource;
  }
  const combined = `${text || ''} ${fileName || ''}`;
  if (
    /Inspection\s*report,?\s*AQC\b/i.test(combined) ||
    /\bAQC\s*(?:Final|Inline|Pre[-\s]?Final|Initial|Mid[-\s]?Line)\b/i.test(combined) ||
    /\bAQC\b/i.test(combined)
  ) {
    return 'AQC';
  }
  return 'BSQC';
}

export function getReportSource(
  report: Pick<InspectionReport, 'reportSource' | 'reportNumber' | 'pdfFileName' | 'inspectionType' | 'inspectionLevel'>
): ReportSource {
  if (report.reportSource === 'AQC' || report.reportSource === 'BSQC') {
    return report.reportSource;
  }
  return detectReportSource(
    `${report.reportNumber || ''} ${report.inspectionType || ''} ${report.inspectionLevel || ''}`,
    report.pdfFileName
  );
}

/**
 * Determines Financial Year label for a given date string (YYYY-MM-DD)
 * Default financial year begins in August (month index 8) and ends in July.
 * E.g., Date in October 2026 -> FY26/27 (Aug 2026 - Jul 2027)
 * E.g., Date in May 2026 -> FY25/26 (Aug 2025 - Jul 2026)
 */
export function getFinancialYear(dateStr: string, startMonth: number = 8): string {
  if (!dateStr) return 'FY26/27';
  const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  let year: number;
  let month: number;

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'FY26/27';
    year = d.getFullYear();
    month = d.getMonth() + 1;
  }

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

export interface FiscalWeekInfo {
  fiscalYear: string;
  weekYear: number;
  weekNumber: number;
  weekKey: string; // e.g. "2026-W47" (unique ISO Mon-Sun week key)
  weekLabel: string; // e.g. "W32" .. "W52"/"W53", "W01" .. "W31"
  fyOrder: number; // chronological Mon-Sun week offset inside the FY
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
}

const ONE_DAY_MS = 86400000;
const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseUtcDateParts(dateStr: string): { year: number; month: number; day: number } {
  const isoMatch = (dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      };
    }
  }
  return { year: 2026, month: 8, day: 1 };
}

/**
 * Maps any inspection date into BESTSELLER's International ISO 8601 Monday–Sunday Week Schedule.
 * Weeks always run Monday -> Sunday (e.g., Week 47, 2026 = Mon Nov 16 - Sun Nov 22, 2026).
 */
export function getFiscalWeekInfo(dateStr: string, fyStartMonth: number = 8): FiscalWeekInfo {
  const { year, month, day } = parseUtcDateParts(dateStr);
  const dateUtc = Date.UTC(year, month - 1, day);

  // Convert JS Sun=0..Sat=6 into ISO Mon=0..Sun=6
  const isoDay = (new Date(dateUtc).getUTCDay() + 6) % 7;
  const weekStartUtc = dateUtc - isoDay * ONE_DAY_MS;
  const weekEndUtc = weekStartUtc + 6 * ONE_DAY_MS;

  // ISO week belongs to the calendar year containing its Thursday
  const thursdayUtc = weekStartUtc + 3 * ONE_DAY_MS;
  const weekYear = new Date(thursdayUtc).getUTCFullYear();

  // Jan 4 is always inside ISO Week 1 of weekYear
  const jan4Utc = Date.UTC(weekYear, 0, 4);
  const jan4IsoDay = (new Date(jan4Utc).getUTCDay() + 6) % 7;
  const week1MondayUtc = jan4Utc - jan4IsoDay * ONE_DAY_MS;

  const weekNumber = 1 + Math.round((weekStartUtc - week1MondayUtc) / (7 * ONE_DAY_MS));
  const weekLabel = `W${String(weekNumber).padStart(2, '0')}`;
  const weekKey = `${weekYear}-${weekLabel}`;

  // Chronological Monday-Sunday week index within the active Financial Year
  const fyStartYear = month >= fyStartMonth ? year : year - 1;
  const fyAnchorUtc = Date.UTC(fyStartYear, fyStartMonth - 1, 1);
  const fyAnchorIsoDay = (new Date(fyAnchorUtc).getUTCDay() + 6) % 7;
  const fyFirstMondayUtc = fyAnchorUtc - fyAnchorIsoDay * ONE_DAY_MS;
  const fyOrder = Math.max(0, Math.round((weekStartUtc - fyFirstMondayUtc) / (7 * ONE_DAY_MS)));

  return {
    fiscalYear: getFinancialYear(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, fyStartMonth),
    weekYear,
    weekNumber,
    weekKey,
    weekLabel,
    fyOrder,
    weekStartDate: new Date(weekStartUtc).toISOString().slice(0, 10),
    weekEndDate: new Date(weekEndUtc).toISOString().slice(0, 10),
  };
}

export function getIsoWeekKey(dateStr: string): string {
  if (!dateStr) return '';
  return getFiscalWeekInfo(dateStr).weekKey;
}

export function formatWeekDateRange(weekStartDate: string, weekEndDate: string): string {
  const sMatch = weekStartDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const eMatch = weekEndDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!sMatch || !eMatch) return `${weekStartDate} - ${weekEndDate}`;

  const sYear = Number(sMatch[1]);
  const sMonth = SHORT_MONTH_NAMES[Number(sMatch[2]) - 1] || sMatch[2];
  const sDay = Number(sMatch[3]);

  const eYear = Number(eMatch[1]);
  const eMonth = SHORT_MONTH_NAMES[Number(eMatch[2]) - 1] || eMatch[2];
  const eDay = Number(eMatch[3]);

  if (sYear === eYear) {
    return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${eYear}`;
  }
  return `${sMonth} ${sDay}, ${sYear} - ${eMonth} ${eDay}, ${eYear}`;
}

export function formatWeekOptionLabel(info: Pick<FiscalWeekInfo, 'weekLabel' | 'weekStartDate' | 'weekEndDate'>): string {
  return `${info.weekLabel} (${formatWeekDateRange(info.weekStartDate, info.weekEndDate)})`;
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

export function normalizeMultiSelect(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) {
    return Array.from(
      new Set(val.map((v) => String(v || '').trim()).filter((v) => v !== '' && v !== 'ALL'))
    );
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed && trimmed !== 'ALL') return [trimmed];
  }
  return [];
}

/**
 * Filter reports according to global filters
 */
export function filterReports(
  reports: InspectionReport[],
  filters: {
    buyer?: string | string[];
    financialYear?: string | string[];
    floors?: string[];
    reportSource?: 'ALL' | ReportSource;
    month?: string | string[];
    week?: string | string[];
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
  const selectedMonths = normalizeMultiSelect(filters.month);
  const selectedWeeks = normalizeMultiSelect(filters.week);

  return reports.filter((report) => {
    if (Array.isArray(filters.buyer)) {
      if (filters.buyer.length > 0 && !filters.buyer.includes('ALL')) {
        const repBuyer = (report.buyer || '').toLowerCase().trim();
        const matched = filters.buyer.some((b) => b.toLowerCase().trim() === repBuyer);
        if (!matched) return false;
      }
    } else if (filters.buyer && filters.buyer !== 'ALL' && report.buyer.toLowerCase() !== filters.buyer.toLowerCase()) {
      return false;
    }

    if (Array.isArray(filters.financialYear)) {
      if (filters.financialYear.length > 0 && !filters.financialYear.includes('ALL')) {
        const repFy = getFinancialYear(report.inspectionDate, fyStartMonth);
        if (!filters.financialYear.includes(repFy)) return false;
      }
    } else if (filters.financialYear && filters.financialYear !== 'ALL') {
      const repFy = getFinancialYear(report.inspectionDate, fyStartMonth);
      if (repFy !== filters.financialYear) return false;
    }

    if (Array.isArray(filters.floors) && filters.floors.length > 0 && !filters.floors.includes('ALL')) {
      const repFloor = normalizeFloorName(report.floor || report.section);
      const floorMatched = filters.floors.some((f) => normalizeFloorName(f) === repFloor);
      if (!floorMatched) return false;
    }

    if (filters.reportSource && filters.reportSource !== 'ALL') {
      if (getReportSource(report) !== filters.reportSource) return false;
    }

    if (selectedMonths.length > 0) {
      // Month format: 'YYYY-MM'
      const repMonth = report.targetMonth && /^\d{4}-\d{2}$/.test(report.targetMonth)
        ? report.targetMonth
        : (report.inspectionDate || '').slice(0, 7);
      const monthMatched = selectedMonths.some(
        (m) => report.inspectionDate.startsWith(m) || repMonth === m
      );
      if (!monthMatched) return false;
    }

    if (selectedWeeks.length > 0) {
      // Week format: 'YYYY-Www' (ISO 8601 Monday–Sunday week) or 'Www'
      const repWeekInfo = getFiscalWeekInfo(report.inspectionDate, fyStartMonth);
      const weekMatched = selectedWeeks.some((w) =>
        w.includes('-W') ? repWeekInfo.weekKey === w : repWeekInfo.weekLabel === w
      );
      if (!weekMatched) return false;
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
      const q = filters.defectGroup.toLowerCase().trim();
      const matchedCat = MASTER_DEFECT_23_CATEGORIES.find(
        (c) =>
          c.name.toLowerCase() === q ||
          c.code.toLowerCase() === q ||
          `dg-${c.code.toLowerCase()}` === q ||
          `${c.name.toLowerCase()} (${c.code.toLowerCase()})` === q
      );
      const targetGid = matchedCat ? `dg-${matchedCat.code.toLowerCase()}` : '';
      const hasGroup = report.defects?.some((d) => {
        const resolved = resolveDefectAccurate(d);
        const gid = resolved.defectGroupId.toLowerCase();
        const orig = (d.originalDefectName || '').toLowerCase();
        const std = resolved.standardDefectName.toLowerCase();
        return (
          (targetGid && gid === targetGid) ||
          gid === q ||
          gid.includes(q) ||
          orig.includes(q) ||
          std.includes(q) ||
          (q.startsWith('dg-') && gid === q)
        );
      });
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
