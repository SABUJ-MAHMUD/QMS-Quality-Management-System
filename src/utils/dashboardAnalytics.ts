import { CAPARecord, InspectionReport } from '../types';
import { getCanonicalDefectInfo } from '../data/defectMasterData';
import {
  getFiscalWeekInfo,
  normalizeFloorName,
  normalizeMultiSelect,
  formatWeekDateRange,
  formatWeekOptionLabel,
} from './oqlCalculator';

export interface TopSingleDefectBar {
  code: string;
  name: string;
  codeAndName: string;
  categoryCode: string;
  categoryName: string;
  count: number;
  percentage: number;
  barLabel: string;
}

export interface MonthComparisonDefectItem {
  code: string;
  name: string;
  codeAndName: string;
  current: number;
  currentPct: number;
  currentLabel: string;
  previous: number;
  previousPct: number;
  previousLabel: string;
}

export interface MonthToMonthComparisonResult {
  currMonthKey: string;
  prevMonthKey: string;
  currMonthLabel: string;
  prevMonthLabel: string;
  currTotalDefects: number;
  prevTotalDefects: number;
  currInspectedQty: number;
  prevInspectedQty: number;
  items: MonthComparisonDefectItem[];
}

export interface WeeklyOqlPoint {
  weekKey: string;
  weekLabel: string; // e.g. "W32", "W47"
  fiscalYear: string;
  fyOrder: number;
  weekStartDate: string;
  weekEndDate: string;
  dateRangeLabel: string; // e.g. "Nov 16 - Nov 22, 2026"
  inspected: number;
  defects: number;
  reportCount: number;
  oql: number;
}

export interface WeekFilterOption {
  weekKey: string; // e.g. "2026-W47"
  weekLabel: string; // e.g. "W47"
  weekStartDate: string; // Monday YYYY-MM-DD
  weekEndDate: string; // Sunday YYYY-MM-DD
  dateRangeLabel: string; // e.g. "Nov 16 - Nov 22, 2026"
  optionLabel: string; // e.g. "W47 (Nov 16 - Nov 22, 2026)"
  reportCount: number;
}

export interface FloorSummaryItem {
  floor: string;
  reportCount: number;
  styleCount: number;
  inspectedQty: number;
}

export function formatPctText(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '0%';
  const rounded = Number(pct.toFixed(2));
  if (rounded === 0) return '0%';
  return `${rounded.toFixed(2)}%`;
}

export function formatQtyAndPct(qty: number, pct: number): string {
  return `${qty} (${formatPctText(pct)})`;
}

export function getPreviousMonthKey(monthKey: string): string {
  const m = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!m) return '';
  let year = parseInt(m[1], 10);
  let month = parseInt(m[2], 10) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthShort(monthKey: string): string {
  const m = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!m) return monthKey;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = parseInt(m[2], 10) - 1;
  return `${monthNames[idx] || m[2]} ${m[1]}`;
}

function getReportMonthKey(report: InspectionReport): string {
  if (report.targetMonth && /^\d{4}-\d{2}$/.test(report.targetMonth)) {
    return report.targetMonth;
  }
  if (report.inspectionDate && report.inspectionDate.length >= 7) {
    return report.inspectionDate.slice(0, 7);
  }
  return '';
}

/**
 * Computes Top N single defects (NEVER groups) across reports with exact PDF Code, Name, Qty
 * and Rate (%) calculated strictly as: (Single Defect Qty / Total Inspected Qty) * 100.
 */
export function computeTopSingleDefects(
  reports: InspectionReport[],
  maxCount: number = 5
): TopSingleDefectBar[] {
  const map = new Map<
    string,
    {
      code: string;
      name: string;
      categoryCode: string;
      categoryName: string;
      count: number;
    }
  >();

  let totalInspectedQty = 0;

  reports.forEach((r) => {
    totalInspectedQty += Number(r.inspectedQuantity) || 0;
    (r.defects || []).forEach((d) => {
      const qty = Number(d.defectQuantity) || 0;
      if (qty <= 0) return;

      const info = getCanonicalDefectInfo(d);
      const key = `${info.code}::${info.name.toLowerCase()}`;

      const existing = map.get(key);
      if (existing) {
        existing.count += qty;
      } else {
        map.set(key, {
          code: info.code,
          name: info.name,
          categoryCode: info.categoryCode,
          categoryName: info.categoryName,
          count: qty,
        });
      }
    });
  });

  if (map.size === 0) {
    return [];
  }

  return Array.from(map.values())
    .map((entry) => {
      const percentage = totalInspectedQty > 0 ? Number(((entry.count / totalInspectedQty) * 100).toFixed(2)) : 0;
      return {
        code: entry.code,
        name: entry.name,
        codeAndName: `${entry.code}: ${entry.name}`,
        categoryCode: entry.categoryCode,
        categoryName: entry.categoryName,
        count: entry.count,
        percentage,
        barLabel: formatQtyAndPct(entry.count, percentage),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, maxCount);
}

/**
 * Computes Month-to-Month comparison by single defect (e.g. Nov 2026 vs Oct 2026),
 * returning quantity and defect rate (%) = (Month Defect Qty / Month Inspected Qty) * 100.
 */
export function computeMonthToMonthTopDefects(
  reports: InspectionReport[],
  selectedMonth: string | string[] = 'ALL',
  now: Date = new Date(),
  maxCount: number = 5
): MonthToMonthComparisonResult {
  const nowMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const reportMonths = Array.from(
    new Set(reports.map(getReportMonthKey).filter((ym) => /^\d{4}-\d{2}$/.test(ym)))
  ).sort((a, b) => b.localeCompare(a));

  const validSelectedMonths = normalizeMultiSelect(selectedMonth)
    .filter((ym) => /^\d{4}-\d{2}$/.test(ym))
    .sort((a, b) => b.localeCompare(a));

  let currMonthKey = nowMonthKey;
  if (validSelectedMonths.length > 0) {
    currMonthKey = validSelectedMonths[0];
  } else if (reportMonths.length > 0) {
    const prevOfNow = getPreviousMonthKey(nowMonthKey);
    const hasNowOrPrev = reportMonths.includes(nowMonthKey) || reportMonths.includes(prevOfNow);
    currMonthKey = hasNowOrPrev ? nowMonthKey : reportMonths[0];
  }

  const prevMonthKey = getPreviousMonthKey(currMonthKey);
  const currMonthLabel = formatMonthShort(currMonthKey);
  const prevMonthLabel = formatMonthShort(prevMonthKey);

  const collectMonthSingleDefects = (monthKey: string) => {
    const map = new Map<string, { code: string; name: string; count: number }>();
    let monthTotal = 0;
    let monthInspected = 0;

    if (!monthKey) return { map, monthTotal, monthInspected };

    reports
      .filter((r) => getReportMonthKey(r) === monthKey)
      .forEach((r) => {
        monthInspected += Number(r.inspectedQuantity) || 0;
        (r.defects || []).forEach((d) => {
          const qty = Number(d.defectQuantity) || 0;
          if (qty <= 0) return;

          const info = getCanonicalDefectInfo(d);
          const key = `${info.code}::${info.name.toLowerCase()}`;
          monthTotal += qty;

          const existing = map.get(key);
          if (existing) {
            existing.count += qty;
          } else {
            map.set(key, { code: info.code, name: info.name, count: qty });
          }
        });
      });

    return { map, monthTotal, monthInspected };
  };

  const currRes = collectMonthSingleDefects(currMonthKey);
  const prevRes = collectMonthSingleDefects(prevMonthKey);

  const allKeys = Array.from(
    new Set([...Array.from(currRes.map.keys()), ...Array.from(prevRes.map.keys())])
  );

  if (allKeys.length === 0) {
    return {
      currMonthKey,
      prevMonthKey,
      currMonthLabel,
      prevMonthLabel,
      currTotalDefects: 0,
      prevTotalDefects: 0,
      currInspectedQty: currRes.monthInspected,
      prevInspectedQty: prevRes.monthInspected,
      items: [],
    };
  }

  const items: MonthComparisonDefectItem[] = allKeys
    .map((key) => {
      const cEntry = currRes.map.get(key);
      const pEntry = prevRes.map.get(key);
      const code = cEntry?.code || pEntry?.code || 'Gen';
      const name = cEntry?.name || pEntry?.name || 'Unspecified Defect';
      const current = cEntry?.count || 0;
      const previous = pEntry?.count || 0;
      const currentPct =
        currRes.monthInspected > 0 ? Number(((current / currRes.monthInspected) * 100).toFixed(2)) : 0;
      const previousPct =
        prevRes.monthInspected > 0 ? Number(((previous / prevRes.monthInspected) * 100).toFixed(2)) : 0;

      return {
        code,
        name,
        codeAndName: `${code}: ${name}`,
        current,
        currentPct,
        currentLabel: current > 0 ? formatQtyAndPct(current, currentPct) : '',
        previous,
        previousPct,
        previousLabel: previous > 0 ? formatQtyAndPct(previous, previousPct) : '',
        _sortTotal: current + previous,
      };
    })
    .sort((a, b) => b._sortTotal - a._sortTotal || b.current - a.current || b.previous - a.previous)
    .slice(0, maxCount)
    .map(({ _sortTotal, ...rest }) => rest);

  return {
    currMonthKey,
    prevMonthKey,
    currMonthLabel,
    prevMonthLabel,
    currTotalDefects: currRes.monthTotal,
    prevTotalDefects: prevRes.monthTotal,
    currInspectedQty: currRes.monthInspected,
    prevInspectedQty: prevRes.monthInspected,
    items,
  };
}

/**
 * Computes Weekly OQL Trend sorted chronologically in ISO 8601 Monday–Sunday week order
 * (matching BESTSELLER Online Inspection Portal week schedule).
 */
export function computeWeeklyOqlTrend(
  reports: InspectionReport[],
  fyStartMonth: number = 8
): WeeklyOqlPoint[] {
  const fySet = new Set<string>();
  const weekMap = new Map<
    string,
    {
      weekLabel: string;
      fiscalYear: string;
      fyOrder: number;
      weekStartDate: string;
      weekEndDate: string;
      dateRangeLabel: string;
      inspected: number;
      defects: number;
      reportCount: number;
    }
  >();

  reports.forEach((r) => {
    if (!r.inspectionDate) return;
    const info = getFiscalWeekInfo(r.inspectionDate, fyStartMonth);
    fySet.add(info.fiscalYear);
    const key = info.weekKey;
    const curr = weekMap.get(key) || {
      weekLabel: info.weekLabel,
      fiscalYear: info.fiscalYear,
      fyOrder: info.fyOrder,
      weekStartDate: info.weekStartDate,
      weekEndDate: info.weekEndDate,
      dateRangeLabel: formatWeekDateRange(info.weekStartDate, info.weekEndDate),
      inspected: 0,
      defects: 0,
      reportCount: 0,
    };
    curr.inspected += Number(r.inspectedQuantity) || 0;
    curr.defects += Number(r.totalDefectQuantity) || 0;
    curr.reportCount += 1;
    weekMap.set(key, curr);
  });

  const multiFy = fySet.size > 1;

  return Array.from(weekMap.entries())
    .sort((a, b) => a[1].weekStartDate.localeCompare(b[1].weekStartDate))
    .map(([weekKey, w]) => ({
      weekKey,
      weekLabel: multiFy ? `${w.weekLabel} (${w.fiscalYear.replace('FY', '')})` : w.weekLabel,
      fiscalYear: w.fiscalYear,
      fyOrder: w.fyOrder,
      weekStartDate: w.weekStartDate,
      weekEndDate: w.weekEndDate,
      dateRangeLabel: w.dateRangeLabel,
      inspected: w.inspected,
      defects: w.defects,
      reportCount: w.reportCount,
      oql: w.inspected > 0 ? Number(((w.defects / w.inspected) * 100).toFixed(2)) : 0,
    }));
}

export function weekOverlapsAnyMonth(
  week: Pick<WeekFilterOption, 'weekStartDate' | 'weekEndDate'>,
  months: string | string[] | undefined
): boolean {
  const selectedMonths = normalizeMultiSelect(months);
  if (selectedMonths.length === 0) return true;
  return selectedMonths.some(
    (m) => week.weekStartDate.startsWith(m) || week.weekEndDate.startsWith(m)
  );
}

export function formatSelectedPeriodLabel(
  months: string | string[] | undefined,
  weeks: string | string[] | undefined,
  availableWeeksAll: WeekFilterOption[] = []
): string | undefined {
  const selWeeks = normalizeMultiSelect(weeks);
  if (selWeeks.length > 0) {
    return selWeeks
      .map((wkKey) => {
        const found = availableWeeksAll.find((w) => w.weekKey === wkKey);
        return found ? found.optionLabel : wkKey;
      })
      .join(', ');
  }
  const selMonths = normalizeMultiSelect(months);
  if (selMonths.length > 0) {
    return selMonths.join(', ');
  }
  return undefined;
}

/**
 * Builds distinct Monday–Sunday ISO week filter options derived from reports,
 * sorted newest-week-first (matching the Month dropdown sort order).
 */
export function buildAvailableWeeks(
  reports: InspectionReport[],
  fyStartMonth: number = 8,
  monthFilter: string | string[] = 'ALL'
): WeekFilterOption[] {
  const weekMap = new Map<string, WeekFilterOption>();
  const selectedMonths = normalizeMultiSelect(monthFilter);

  reports.forEach((r) => {
    if (!r.inspectionDate) return;
    const info = getFiscalWeekInfo(r.inspectionDate, fyStartMonth);
    if (
      selectedMonths.length > 0 &&
      !selectedMonths.some((m) => info.weekStartDate.startsWith(m) || info.weekEndDate.startsWith(m))
    ) {
      return;
    }
    const existing = weekMap.get(info.weekKey);
    if (existing) {
      existing.reportCount += 1;
    } else {
      weekMap.set(info.weekKey, {
        weekKey: info.weekKey,
        weekLabel: info.weekLabel,
        weekStartDate: info.weekStartDate,
        weekEndDate: info.weekEndDate,
        dateRangeLabel: formatWeekDateRange(info.weekStartDate, info.weekEndDate),
        optionLabel: formatWeekOptionLabel(info),
        reportCount: 1,
      });
    }
  });

  return Array.from(weekMap.values()).sort((a, b) =>
    b.weekStartDate.localeCompare(a.weekStartDate)
  );
}

/**
 * Computes report counts and distinct inspected style counts per sewing floor.
 */
export function computeFloorStats(reports: InspectionReport[]): {
  distinctStyleCount: number;
  byFloor: FloorSummaryItem[];
} {
  const allStyles = new Set<string>();
  const floorMap = new Map<string, { reportCount: number; styles: Set<string>; inspectedQty: number }>();

  ['SEW-1', 'SEW-2', 'SEW-3'].forEach((fl) => {
    floorMap.set(fl, { reportCount: 0, styles: new Set(), inspectedQty: 0 });
  });

  reports.forEach((r) => {
    const style = (r.styleNumber || '').trim();
    if (style) allStyles.add(style);
    const fl = normalizeFloorName(r.floor || r.section);
    const entry = floorMap.get(fl) || { reportCount: 0, styles: new Set<string>(), inspectedQty: 0 };
    entry.reportCount += 1;
    if (style) entry.styles.add(style);
    entry.inspectedQty += Number(r.inspectedQuantity) || 0;
    floorMap.set(fl, entry);
  });

  const byFloor: FloorSummaryItem[] = Array.from(floorMap.entries()).map(([floor, data]) => ({
    floor,
    reportCount: data.reportCount,
    styleCount: data.styles.size,
    inspectedQty: data.inspectedQty,
  }));

  return {
    distinctStyleCount: allStyles.size,
    byFloor,
  };
}

/**
 * Identifies accidental duplicate report records sharing identical canonical order tokens, style, date,
 * stage, inspected quantity, and defect count — while preserving legitimate repeat Inline/Final inspections
 * of the same style across different lots, dates, or audit outcomes.
 */
export function findDuplicateReportIds(reports: InspectionReport[]): string[] {
  const seen = new Map<string, string>();
  const duplicateIds: string[] = [];

  const ordered = [...reports].sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  );

  for (const r of ordered) {
    const canonicalOrder = (r.orderNumber || '')
      .split(/[+,/]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join('+');

    const key = [
      (r.reportNumber || '').trim().toLowerCase(),
      canonicalOrder || (r.orderNumber || '').trim().toLowerCase(),
      (r.styleNumber || '').trim().toLowerCase(),
      (r.inspectionDate || '').trim(),
      (r.inspectionType || 'Final').trim().toLowerCase(),
      String(Number(r.inspectedQuantity) || 0),
      String(Number(r.totalDefectQuantity) || 0),
    ].join('::');

    if (!key.replace(/[:0]/g, '')) continue;
    if (seen.has(key)) {
      duplicateIds.push(r.id);
    } else {
      seen.set(key, r.id);
    }
  }

  return duplicateIds;
}

/**
 * Generates practical garment-factory 5-Why RCA & CAPA starter guidance for any defect category.
 */
export function buildDefaultCapaGuidance(categoryCode: string, defectName: string) {
  const code = categoryCode.toUpperCase();
  const label = defectName || 'selected defect';

  const templates: Record<
    string,
    {
      rootCause: string;
      why1: string;
      why2: string;
      why3: string;
      why4: string;
      why5: string;
      correction: string;
      correctiveAction: string;
      preventiveAction: string;
    }
  > = {
    SE: {
      rootCause: `Incorrect machine tension, stitch density, or operator handling alignment causing "${label}".`,
      why1: `Seam/stitch failed spec (${label}) at sewing operation.`,
      why2: 'Needle thread tension and differential feed drifted during bulk run.',
      why3: 'In-line roaming QC check missed the hourly machine gauge audit.',
      why4: 'Pre-shift tension & SPI verification log was not signed off.',
      why5: 'Standardized machine calibration checklist not enforced at operator changeover.',
      correction: '100% quarantine & re-inspection of affected bundle; repair defective seams.',
      correctiveAction: 'Re-adjust sewing machine tension/folder guide and retrain line operator.',
      preventiveAction: 'Mandate 2-hourly SPI & tension audit log signed by mechanic and line supervisor.',
    },
    CLE: {
      rootCause: `Machine oil leakage or improper thread-trimming & workstation housekeeping causing "${label}".`,
      why1: `Garment surface/reverse exhibited "${label}".`,
      why2: 'Residual thread tails or oil droplets transferred during sewing/handling.',
      why3: 'Thread trimmer blades worn / oil guard not wiped before operation.',
      why4: 'Tabletop & needle bar cleaning protocol skipped between color lots.',
      why5: 'Preventive maintenance & workstation cleanliness audit not scheduled per shift.',
      correction: 'Spot clean/re-trim 100% of current lot and segregate stained garments.',
      correctiveAction: 'Clean needle bar/oil shield, replace dull trimmer blades, and brief helpers.',
      preventiveAction: 'Implement shift-start oil barrier check & trimming gauge audit at finishing.',
    },
    FA: {
      rootCause: `Raw fabric inspection defect slipped through cutting into production causing "${label}".`,
      why1: `Fabric defect (${label}) detected in finished garment.`,
      why2: 'Defective fabric roll area was not flagged during spreading/cutting.',
      why3: '4-point fabric inspection coverage on incoming roll was below standard.',
      why4: 'Defect sticker flagging missed on shaded/knit defect zones.',
      why5: 'Incoming fabric QC gate and cutting table rejection SOP lacked strict hold criteria.',
      correction: 'Hold remaining cut panels from same dye lot and replace defective panels.',
      correctiveAction: 'Conduct 100% 4-point re-inspection on balance fabric rolls.',
      preventiveAction: 'Enforce mandatory 4-point fabric audit & fabric defect mapping before cutting.',
    },
    PR: {
      rootCause: `Improper steam iron temperature, pressure, or Teflon shoe condition causing "${label}".`,
      why1: `Pressing defect (${label}) observed after finishing.`,
      why2: 'Iron soleplate temperature/pressure exceeded fabric tolerance.',
      why3: 'Pressing Teflon shoe/buck padding worn or dirty.',
      why4: 'Pressing test on mock garment skipped when switching fabric GSM.',
      why5: 'Finishing iron calibration & pad replacement schedule not monitored.',
      correction: 'Re-steam/re-press affected garments using damp cloth barrier.',
      correctiveAction: 'Verify iron thermostat calibration and fit fresh Teflon shoe.',
      preventiveAction: 'Set daily iron temperature verification & fabric-specific pressing chart.',
    },
  };

  return (
    templates[code] || {
      rootCause: `Process control deviation during production/finishing leading to "${label}".`,
      why1: `Inspection identified "${label}" above acceptable standard.`,
      why2: 'Operation checkpoint parameter varied from sealed approval sample.',
      why3: 'First-output verification at station did not catch the variance.',
      why4: 'Operator & inline QC lacked side-by-side sealed sample reference check.',
      why5: 'Standard Operating Procedure (SOP) audit cadence not enforced across shifts.',
      correction: 'Segregate affected batch, 100% check current WIP, and rectify defective units.',
      correctiveAction: 'Calibrate station setup against sealed sample and brief responsible operator.',
      preventiveAction: 'Add dedicated station checkpoint in inline & pre-final QMS audit checklist.',
    }
  );
}

export interface DynamicCapaRow {
  rowKey: string;
  existingCapaId?: string;
  isVirtual: boolean;
  capaRecord: CAPARecord;
  code: string;
  pureName: string;
  categoryCode: string;
  categoryName: string;
  reportCount: number;
  orderCount: number;
  isPinnedToDashboard: boolean;
}

const extractDefectCodeToken = (defectName: string): string => {
  const m = (defectName || '').trim().match(/^\[?([A-Za-z]{2,4}-\d{1,3})\]?\s*[:\-]/i);
  return m ? m[1].toLowerCase() : '';
};

const normalizeDefectNameForMatch = (defectName: string): string => {
  return (defectName || '')
    .replace(/^\[?[A-Za-z]{2,4}-?\d{1,3}\]?\s*[:\-]?\s*/, '')
    .trim()
    .toLowerCase();
};

/**
 * Dynamically aggregates single defects from the active filteredReports slice,
 * merges them with saved CAPARecord plans (preserving edited 5-Why, actions, owner, status, pin state),
 * and ranks strictly Highest Defects First so both Dashboard RCA & CAPA and RCA & CAPA page stay synced.
 */
export function computeDynamicCapaRows(
  filteredReports: InspectionReport[],
  savedCapas: CAPARecord[],
  options?: { includeUnmatchedSaved?: boolean }
): DynamicCapaRow[] {
  const defectMap = new Map<
    string,
    {
      code: string;
      pureName: string;
      displayName: string;
      categoryCode: string;
      categoryName: string;
      severity: 'Critical' | 'Major' | 'Minor';
      qty: number;
      reportIds: Set<string>;
      orderNumbers: Set<string>;
      latestReport: InspectionReport;
    }
  >();

  filteredReports.forEach((r) => {
    (r.defects || []).forEach((d) => {
      const qty = Number(d.defectQuantity) || 0;
      if (qty <= 0) return;

      const info = getCanonicalDefectInfo(d);
      const key = `${info.code.toLowerCase()}::${info.name.toLowerCase()}`;
      const displayName = info.code && info.code !== 'Gen' ? `${info.code}: ${info.name}` : info.name;
      const existing = defectMap.get(key);

      if (existing) {
        existing.qty += qty;
        existing.reportIds.add(r.id);
        if (r.orderNumber) existing.orderNumbers.add(r.orderNumber);
        if (d.severity === 'Critical') existing.severity = 'Critical';
        else if (d.severity === 'Major' && existing.severity === 'Minor') existing.severity = 'Major';
      } else {
        const orderSet = new Set<string>();
        if (r.orderNumber) orderSet.add(r.orderNumber);
        defectMap.set(key, {
          code: info.code,
          pureName: info.name,
          displayName,
          categoryCode: info.categoryCode,
          categoryName: info.categoryName,
          severity:
            d.severity === 'Critical' || d.severity === 'Major' || d.severity === 'Minor'
              ? d.severity
              : 'Major',
          qty,
          reportIds: new Set([r.id]),
          orderNumbers: orderSet,
          latestReport: r,
        });
      }
    });
  });

  // Index saved CAPAs by defect code and normalized defect name for O(1) matching
  const capaByCode = new Map<string, CAPARecord>();
  const capaByName = new Map<string, CAPARecord>();
  savedCapas.forEach((c) => {
    const codeTok = extractDefectCodeToken(c.defectName || '');
    if (codeTok && !capaByCode.has(codeTok)) {
      capaByCode.set(codeTok, c);
    }
    const nameKey = normalizeDefectNameForMatch(c.defectName || '');
    if (nameKey && !capaByName.has(nameKey)) {
      capaByName.set(nameKey, c);
    }
  });

  const matchedCapaIds = new Set<string>();
  const rows: DynamicCapaRow[] = [];

  Array.from(defectMap.entries()).forEach(([key, entry], idx) => {
    const codeKey = entry.code.toLowerCase();
    const nameKey = entry.pureName.trim().toLowerCase();
    const matchedCapa =
      (codeKey && codeKey !== 'gen' ? capaByCode.get(codeKey) : undefined) ||
      capaByName.get(nameKey);

    if (matchedCapa) {
      matchedCapaIds.add(matchedCapa.id);
    }

    const orderArr = Array.from(entry.orderNumbers);
    const orderSummary =
      orderArr.length > 1
        ? `${orderArr[0]} (+${orderArr.length - 1} orders)`
        : orderArr[0] || entry.latestReport.orderNumber;
    const reportSummary =
      entry.reportIds.size > 1
        ? `${entry.reportIds.size} Reports Combined`
        : entry.latestReport.reportNumber;

    const guidance = buildDefaultCapaGuidance(entry.categoryCode, entry.displayName);

    const resolvedRecord: CAPARecord = matchedCapa
      ? {
          ...matchedCapa,
          defectName: entry.displayName,
          defectGroup: entry.categoryName || matchedCapa.defectGroup,
          defectQuantity: entry.qty,
          reportNumber: reportSummary,
          orderNumber: orderSummary,
          styleNumber: entry.latestReport.styleNumber || matchedCapa.styleNumber,
          buyer: entry.latestReport.buyer || matchedCapa.buyer,
        }
      : {
          id: `auto-capa-${codeKey}-${idx}`,
          capaId: `CAPA-AUTO-${entry.code.toUpperCase()}`,
          inspectionReportId: entry.latestReport.id,
          reportNumber: reportSummary,
          orderNumber: orderSummary,
          styleNumber: entry.latestReport.styleNumber || '',
          buyer: entry.latestReport.buyer || 'BESTSELLER',
          defectName: entry.displayName,
          defectGroup: entry.categoryName,
          defectSeverity: entry.severity,
          defectQuantity: entry.qty,
          rootCause: guidance.rootCause,
          fiveWhyAnalysis: {
            why1: guidance.why1,
            why2: guidance.why2,
            why3: guidance.why3,
            why4: guidance.why4,
            why5: guidance.why5,
          },
          correction: guidance.correction,
          correctiveAction: guidance.correctiveAction,
          preventiveAction: guidance.preventiveAction,
          responsiblePerson: 'Quality & Production Lead',
          responsibleDepartment: 'Sewing & Finishing',
          targetCompletionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          monitoringFrequency: 'Weekly',
          monitoringMethod: 'Daily 50 garments random end-line audit',
          capaStatus: 'Open',
          effectivenessStatus: 'Under Monitoring',
          showOnDashboard: false,
          isDemo: false,
          createdAt: entry.latestReport.createdAt || new Date().toISOString(),
          updatedAt: entry.latestReport.updatedAt || new Date().toISOString(),
        };

    rows.push({
      rowKey: key,
      existingCapaId: matchedCapa?.id,
      isVirtual: !matchedCapa,
      capaRecord: resolvedRecord,
      code: entry.code,
      pureName: entry.pureName,
      categoryCode: entry.categoryCode,
      categoryName: entry.categoryName,
      reportCount: entry.reportIds.size,
      orderCount: orderArr.length,
      isPinnedToDashboard: matchedCapa?.showOnDashboard === true,
    });
  });

  if (options?.includeUnmatchedSaved) {
    savedCapas.forEach((c) => {
      if (matchedCapaIds.has(c.id)) return;
      const info = getCanonicalDefectInfo({
        originalDefectName: c.defectName,
        standardDefectName: c.defectName,
        defectGroupId: c.defectGroup,
      });
      const fallbackQty = filteredReports.length === 0 ? Number(c.defectQuantity) || 0 : 0;
      rows.push({
        rowKey: `saved::${c.id}`,
        existingCapaId: c.id,
        isVirtual: false,
        capaRecord: {
          ...c,
          defectQuantity: fallbackQty,
        },
        code: info.code,
        pureName: info.name,
        categoryCode: info.categoryCode,
        categoryName: info.categoryName,
        reportCount: fallbackQty > 0 ? 1 : 0,
        orderCount: c.orderNumber ? 1 : 0,
        isPinnedToDashboard: c.showOnDashboard === true,
      });
    });
  }

  return rows.sort(
    (a, b) =>
      (Number(b.capaRecord.defectQuantity) || 0) - (Number(a.capaRecord.defectQuantity) || 0) ||
      b.reportCount - a.reportCount ||
      a.capaRecord.defectName.localeCompare(b.capaRecord.defectName)
  );
}

/**
 * Selects the Dashboard RCA & CAPA summary rows:
 * Shows defects pushed to Dashboard (showOnDashboard === true) that occur in the active filter slice,
 * dynamically ranked Highest Defects First (পর্যায়ক্রমে উপর থেকে নীচে).
 */
export function selectDashboardCapaRows(
  dynamicRows: DynamicCapaRow[]
): DynamicCapaRow[] {
  return dynamicRows
    .filter((r) => (Number(r.capaRecord.defectQuantity) || 0) > 0 && r.isPinnedToDashboard)
    .sort(
      (a, b) =>
        (Number(b.capaRecord.defectQuantity) || 0) - (Number(a.capaRecord.defectQuantity) || 0) ||
        b.reportCount - a.reportCount ||
        a.capaRecord.defectName.localeCompare(b.capaRecord.defectName)
    );
}

