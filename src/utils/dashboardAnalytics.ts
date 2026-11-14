import { InspectionReport } from '../types';
import { getCanonicalDefectInfo } from '../data/defectMasterData';

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
  items: MonthComparisonDefectItem[];
}

export function formatPctText(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '0%';
  const rounded = Number(pct.toFixed(1));
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
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
 * Computes Top N single defects (NEVER groups) across reports with exact PDF Code, Name, Qty & % Share.
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

  let totalDefectSum = 0;

  reports.forEach((r) => {
    (r.defects || []).forEach((d) => {
      const qty = Number(d.defectQuantity) || 0;
      if (qty <= 0) return;

      const info = getCanonicalDefectInfo(d);
      const key = `${info.code}::${info.name.toLowerCase()}`;
      totalDefectSum += qty;

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

  if (map.size === 0 || totalDefectSum === 0) {
    return [];
  }

  return Array.from(map.values())
    .map((entry) => {
      const percentage = Number(((entry.count / totalDefectSum) * 100).toFixed(1));
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
 * returning both quantity and percentage share within each month.
 */
export function computeMonthToMonthTopDefects(
  reports: InspectionReport[],
  selectedMonth: string = 'ALL',
  now: Date = new Date(),
  maxCount: number = 5
): MonthToMonthComparisonResult {
  const nowMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const reportMonths = Array.from(
    new Set(reports.map(getReportMonthKey).filter((ym) => /^\d{4}-\d{2}$/.test(ym)))
  ).sort((a, b) => b.localeCompare(a));

  let currMonthKey = nowMonthKey;
  if (selectedMonth && selectedMonth !== 'ALL' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
    currMonthKey = selectedMonth;
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

    if (!monthKey) return { map, monthTotal };

    reports
      .filter((r) => getReportMonthKey(r) === monthKey)
      .forEach((r) => {
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

    return { map, monthTotal };
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
      const currentPct = currRes.monthTotal > 0 ? Number(((current / currRes.monthTotal) * 100).toFixed(1)) : 0;
      const previousPct = prevRes.monthTotal > 0 ? Number(((previous / prevRes.monthTotal) * 100).toFixed(1)) : 0;

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
    items,
  };
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
