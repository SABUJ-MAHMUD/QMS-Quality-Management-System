import { InspectionReport, ReportSource } from '../types';
import { getReportOql, getReportSource, normalizeFloorName } from './oqlCalculator';

export type DefectCountFilterMode = 'ALL' | 'GT_ZERO' | 'ZERO';
export type OqlFilterMode = 'ALL' | 'ABOVE_TARGET' | 'WITHIN_TARGET' | 'ZERO';

export interface DatabaseColumnFilterState {
  stageFilter: string; // 'ALL' | 'Final' | 'Inline' | 'Pre-Final' | 'Initial'
  sourceFilter: 'ALL' | ReportSource;
  floorFilter: string; // 'ALL' | 'SEW-1' | 'SEW-2' | 'SEW-3'
  brandFilter: string; // 'ALL' | brand name
  styleFilter: string; // 'ALL' | styleNumber
  uploadDateFilter: string; // 'ALL' | YYYY-MM-DD
  critFilter: DefectCountFilterMode;
  majFilter: DefectCountFilterMode;
  minFilter: DefectCountFilterMode;
  oqlFilter: OqlFilterMode;
  resultFilter: string; // 'ALL' | 'PASSED' | 'FAILED' | 'PENDING' | 'RE-INSPECTION'
  duplicatesOnly: boolean;
  repeatedOnly: boolean;
}

export const DEFAULT_DATABASE_FILTERS: DatabaseColumnFilterState = {
  stageFilter: 'ALL',
  sourceFilter: 'ALL',
  floorFilter: 'ALL',
  brandFilter: 'ALL',
  styleFilter: 'ALL',
  uploadDateFilter: 'ALL',
  critFilter: 'ALL',
  majFilter: 'ALL',
  minFilter: 'ALL',
  oqlFilter: 'ALL',
  resultFilter: 'ALL',
  duplicatesOnly: false,
  repeatedOnly: false,
};

export interface RepeatedMatchMeta {
  styleCount: number;
  maxPoCount: number;
  isExactDuplicate: boolean;
}

export interface RepeatedStylePoAnalysis {
  repeatedIdSet: Set<string>;
  metaById: Map<string, RepeatedMatchMeta>;
}

export function extractOrderPoTokens(orderNumber?: string, poNumber?: string): string[] {
  const combined = [orderNumber || '', poNumber || ''].filter(Boolean).join('+');
  const set = new Set<string>();
  combined
    .split(/[+,/\s]+/)
    .map((t) => t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').trim().toUpperCase())
    .filter((t) => t.length >= 5 && (t.match(/\d/g) || []).length >= 5)
    .forEach((t) => set.add(t));
  return Array.from(set);
}

/**
 * Finds all reports that share the same Style Number (count >= 2) OR the same PO / Order Number token (count >= 2),
 * plus any exact duplicates. Includes ALL occurrences in the matching group so users can compare uploads side-by-side.
 */
export function analyzeRepeatedStyleAndPo(
  reports: InspectionReport[],
  exactDuplicateIds: Iterable<string> = []
): RepeatedStylePoAnalysis {
  const styleCounts = new Map<string, number>();
  const poCounts = new Map<string, number>();
  const exactSet = new Set<string>(exactDuplicateIds);

  for (const r of reports) {
    const style = (r.styleNumber || '').trim().toUpperCase();
    if (style) {
      styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
    }
    const tokens = extractOrderPoTokens(r.orderNumber, r.poNumber);
    for (const tok of tokens) {
      poCounts.set(tok, (poCounts.get(tok) || 0) + 1);
    }
  }

  const repeatedIdSet = new Set<string>();
  const metaById = new Map<string, RepeatedMatchMeta>();

  for (const r of reports) {
    const style = (r.styleNumber || '').trim().toUpperCase();
    const styleCount = style ? styleCounts.get(style) || 0 : 0;
    const tokens = extractOrderPoTokens(r.orderNumber, r.poNumber);
    let maxPoCount = 0;
    for (const tok of tokens) {
      const c = poCounts.get(tok) || 0;
      if (c > maxPoCount) maxPoCount = c;
    }
    const isExactDuplicate = exactSet.has(r.id);

    if (styleCount > 1 || maxPoCount > 1 || isExactDuplicate) {
      repeatedIdSet.add(r.id);
      metaById.set(r.id, { styleCount, maxPoCount, isExactDuplicate });
    }
  }

  return { repeatedIdSet, metaById };
}

export function getReportBrandLabel(report: Pick<InspectionReport, 'brand' | 'buyer'>): string {
  return (report.brand || report.buyer || 'ONLY&SONS').trim() || 'ONLY&SONS';
}

export function getReportStageLabel(report: Pick<InspectionReport, 'inspectionType'>): string {
  const raw = (report.inspectionType || 'Final').trim();
  return raw || 'Final';
}

export function matchesDefectCountFilter(count: number | undefined, mode: DefectCountFilterMode): boolean {
  const val = Number(count) || 0;
  if (mode === 'GT_ZERO') return val > 0;
  if (mode === 'ZERO') return val === 0;
  return true;
}

export function matchesOqlFilter(
  report: InspectionReport,
  mode: OqlFilterMode,
  targetOql: number,
  decimals: number = 2
): boolean {
  if (mode === 'ALL') return true;
  const oql = getReportOql(report, decimals);
  if (mode === 'ABOVE_TARGET') return oql > targetOql;
  if (mode === 'WITHIN_TARGET') return oql <= targetOql;
  if (mode === 'ZERO') return oql === 0;
  return true;
}

export function filterDatabaseReports(
  reports: InspectionReport[],
  filters: DatabaseColumnFilterState,
  options: {
    targetOql: number;
    oqlDecimals?: number;
    duplicateIdSet?: Set<string>;
    repeatedIdSet?: Set<string>;
  }
): InspectionReport[] {
  const { targetOql, oqlDecimals = 2, duplicateIdSet, repeatedIdSet } = options;

  return reports.filter((r) => {
    if (filters.duplicatesOnly && duplicateIdSet && !duplicateIdSet.has(r.id)) {
      return false;
    }
    if (filters.repeatedOnly && repeatedIdSet && !repeatedIdSet.has(r.id)) {
      return false;
    }
    if (filters.stageFilter !== 'ALL') {
      if (getReportStageLabel(r).toLowerCase() !== filters.stageFilter.toLowerCase()) {
        return false;
      }
    }
    if (filters.sourceFilter !== 'ALL' && getReportSource(r) !== filters.sourceFilter) {
      return false;
    }
    if (filters.floorFilter !== 'ALL') {
      if (normalizeFloorName(r.floor || r.section) !== filters.floorFilter.toUpperCase()) {
        return false;
      }
    }
    if (filters.brandFilter !== 'ALL') {
      if (getReportBrandLabel(r).toLowerCase() !== filters.brandFilter.toLowerCase()) {
        return false;
      }
    }
    if (filters.styleFilter !== 'ALL') {
      if ((r.styleNumber || '').trim() !== filters.styleFilter.trim()) {
        return false;
      }
    }
    if (filters.uploadDateFilter !== 'ALL') {
      const day = (r.createdAt || r.updatedAt || '').slice(0, 10);
      if (day !== filters.uploadDateFilter) return false;
    }
    if (!matchesDefectCountFilter(r.criticalDefectQuantity, filters.critFilter)) {
      return false;
    }
    if (!matchesDefectCountFilter(r.majorDefectQuantity, filters.majFilter)) {
      return false;
    }
    if (!matchesDefectCountFilter(r.minorDefectQuantity, filters.minFilter)) {
      return false;
    }
    if (!matchesOqlFilter(r, filters.oqlFilter, targetOql, oqlDecimals)) {
      return false;
    }
    if (filters.resultFilter !== 'ALL') {
      if ((r.inspectionResult || '').toUpperCase() !== filters.resultFilter.toUpperCase()) {
        return false;
      }
    }
    return true;
  });
}

export function countActiveDatabaseFilters(filters: DatabaseColumnFilterState): number {
  let count = 0;
  if (filters.stageFilter !== 'ALL') count++;
  if (filters.sourceFilter !== 'ALL') count++;
  if (filters.floorFilter !== 'ALL') count++;
  if (filters.brandFilter !== 'ALL') count++;
  if (filters.styleFilter !== 'ALL') count++;
  if (filters.uploadDateFilter !== 'ALL') count++;
  if (filters.critFilter !== 'ALL') count++;
  if (filters.majFilter !== 'ALL') count++;
  if (filters.minFilter !== 'ALL') count++;
  if (filters.oqlFilter !== 'ALL') count++;
  if (filters.resultFilter !== 'ALL') count++;
  if (filters.duplicatesOnly) count++;
  if (filters.repeatedOnly) count++;
  return count;
}
