import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InspectionReport, InspectionDefect } from '../src/types';
import {
  computeTopSingleDefects,
  computeMonthToMonthTopDefects,
  buildDefaultCapaGuidance,
  formatQtyAndPct,
} from '../src/utils/dashboardAnalytics';
import { getCanonicalDefectInfo } from '../src/data/defectMasterData';

function makeDefect(partial: Partial<InspectionDefect> & { originalDefectName: string }): InspectionDefect {
  return {
    id: 'def-1',
    inspectionReportId: 'rep-1',
    standardDefectName: partial.originalDefectName,
    defectGroupId: 'dg-se',
    severity: 'Major',
    defectQuantity: 1,
    classificationStatus: 'Auto-Matched',
    createdAt: '2026-11-10T10:00:00Z',
    ...partial,
  };
}

function makeReport(overrides: Partial<InspectionReport> = {}): InspectionReport {
  return {
    id: 'rep-1',
    reportNumber: 'NOF4778898 - 22031973 - SEW-01',
    orderNumber: 'NOF4778898',
    styleNumber: '22031973',
    styleName: 'Test Style',
    productDescription: 'Test Style',
    color: 'Black',
    buyer: 'ONLY&SONS',
    brand: 'ONLY&SONS',
    factory: 'Northern Fashions Ltd.',
    inspector: 'Rifat Chowdhury',
    inspectionDate: '2026-11-10',
    targetMonth: '2026-11',
    inspectionType: 'Final',
    inspectionLevel: 'AQL 2.5/2.5 Level II Reduced',
    extractionStatus: 'Extracted',
    validationStatus: 'Approved',
    orderQuantity: 2000,
    inspectedQuantity: 50,
    criticalDefectQuantity: 0,
    majorDefectQuantity: 2,
    minorDefectQuantity: 1,
    totalDefectQuantity: 3,
    oql: 6,
    inspectionResult: 'PASSED',
    defects: [],
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    ...overrides,
  };
}

describe('Dashboard Single Defect & Month-to-Month Analytics', () => {
  it('computeTopSingleDefects returns strictly at most 5 single defects with PDF codes and Qty (%) barLabel', () => {
    const reports: InspectionReport[] = [
      makeReport({
        id: 'r1',
        inspectionDate: '2026-11-12',
        targetMonth: '2026-11',
        defects: [
          makeDefect({
            id: 'd1',
            originalDefectName: 'Se-26 Open/Broken Seam at Left & Right- Neck, Armhole, pocket, hem etc.',
            standardDefectName: 'Open/Broken Seam at Left & Right- Neck, Armhole, pocket, hem etc.',
            defectGroupId: 'dg-se',
            severity: 'Major',
            defectQuantity: 2,
          }),
          makeDefect({
            id: 'd2',
            originalDefectName: 'Pr-1 Over pressing causing seam impression',
            standardDefectName: 'Over pressing causing seam impression',
            defectGroupId: 'dg-pr',
            severity: 'Minor',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'd3',
            originalDefectName: 'Cle-5 Oil spots or stains (cannot be removed)',
            standardDefectName: 'Oil spots or stains (cannot be removed)',
            defectGroupId: 'dg-cle',
            severity: 'Major',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'd4',
            originalDefectName: 'Se-2 Skipped stitch',
            standardDefectName: 'Skipped stitch',
            defectGroupId: 'dg-se',
            severity: 'Major',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'd5',
            originalDefectName: 'Cle-3 Untrimmed thread ends reverse side < 2 cm / Un-trimmed thread ends reverse side >2 cm (M)',
            standardDefectName: 'Untrimmed thread ends reverse side < 2 cm / Un-trimmed thread ends reverse side >2 cm (M)',
            defectGroupId: 'dg-cle',
            severity: 'Minor',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'd6',
            originalDefectName: 'Cle-2 Dust on Garments',
            standardDefectName: 'Dust on Garments',
            defectGroupId: 'dg-cle',
            severity: 'Minor',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'd7',
            originalDefectName: 'Fa-10 Foreign Yarns',
            standardDefectName: 'Foreign Yarns',
            defectGroupId: 'dg-fa',
            severity: 'Minor',
            defectQuantity: 1,
          }),
        ],
      }),
    ];

    const top5 = computeTopSingleDefects(reports, 5);
    assert.equal(top5.length, 5, 'Must cap highest defects chart at 5 bars');
    assert.equal(top5[0].code, 'Se-26');
    assert.equal(top5[0].count, 2);
    assert.equal(top5[0].barLabel, '2 (25%)');
    assert.ok(top5.some((d) => d.code === 'Se-2'));
    assert.ok(top5.every((d) => /^\d+\s+\(\d+(\.\d+)?%\)$/.test(d.barLabel)), 'Every bar must show Qty (%)');
  });

  it('computeMonthToMonthTopDefects compares Nov 2026 vs Oct 2026 by single defect with Qty (%) labels', () => {
    const reports: InspectionReport[] = [
      makeReport({
        id: 'nov-1',
        inspectionDate: '2026-11-10',
        targetMonth: '2026-11',
        defects: [
          makeDefect({
            id: 'nd1',
            originalDefectName: 'Pr-1 Over pressing causing seam impression',
            standardDefectName: 'Over pressing causing seam impression',
            defectGroupId: 'dg-pr',
            severity: 'Minor',
            defectQuantity: 1,
          }),
          makeDefect({
            id: 'nd2',
            originalDefectName: 'Cle-5 Oil spots or stains (cannot be removed)',
            standardDefectName: 'Oil spots or stains (cannot be removed)',
            defectGroupId: 'dg-cle',
            severity: 'Major',
            defectQuantity: 1,
          }),
        ],
      }),
      makeReport({
        id: 'oct-1',
        inspectionDate: '2026-10-20',
        targetMonth: '2026-10',
        defects: [
          makeDefect({
            id: 'od1',
            originalDefectName: 'Cle-5 Oil spots or stains (cannot be removed)',
            standardDefectName: 'Oil spots or stains (cannot be removed)',
            defectGroupId: 'dg-cle',
            severity: 'Major',
            defectQuantity: 2,
          }),
          makeDefect({
            id: 'od2',
            originalDefectName: 'Fa-10 Foreign Yarns',
            standardDefectName: 'Foreign Yarns',
            defectGroupId: 'dg-fa',
            severity: 'Minor',
            defectQuantity: 1,
          }),
        ],
      }),
    ];

    const res = computeMonthToMonthTopDefects(reports, 'ALL', new Date('2026-11-14T12:00:00Z'), 5);
    assert.equal(res.currMonthKey, '2026-11');
    assert.equal(res.prevMonthKey, '2026-10');
    assert.equal(res.currMonthLabel, 'Nov 2026');
    assert.equal(res.prevMonthLabel, 'Oct 2026');
    assert.ok(res.items.length >= 3);

    const cle5 = res.items.find((i) => i.code === 'Cle-5');
    assert.ok(cle5, 'Cle-5 should appear as shared single defect across Nov & Oct');
    assert.equal(cle5.current, 1);
    assert.equal(cle5.currentLabel, '1 (50%)');
    assert.equal(cle5.previous, 2);
    assert.equal(cle5.previousLabel, '2 (66.7%)');
  });

  it('getCanonicalDefectInfo resolves PDF codes in O(1) and buildDefaultCapaGuidance returns complete RCA template', () => {
    const info = getCanonicalDefectInfo({
      originalDefectName: 'La-9 Main label Incorrectly placed',
      standardDefectName: 'Main label Incorrectly placed',
      defectGroupId: 'dg-la',
    });
    assert.equal(info.code, 'La-9');
    assert.equal(info.categoryCode, 'La');
    assert.equal(info.categoryName, 'Label, Hangtags, and other accessories');

    const guide = buildDefaultCapaGuidance('Se', 'Se-10: Broken stitching');
    assert.ok(guide.rootCause.includes('Se-10: Broken stitching'));
    assert.ok(guide.why5.length > 10);
    assert.equal(formatQtyAndPct(3, 37.5), '3 (37.5%)');
  });
});
