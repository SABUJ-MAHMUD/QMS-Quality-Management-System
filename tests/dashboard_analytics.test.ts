import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InspectionReport, InspectionDefect } from '../src/types';
import {
  computeTopSingleDefects,
  computeMonthToMonthTopDefects,
  computeWeeklyOqlTrend,
  computeFloorStats,
  findDuplicateReportIds,
  buildDefaultCapaGuidance,
  formatQtyAndPct,
} from '../src/utils/dashboardAnalytics';
import { getFiscalWeekInfo, filterReports } from '../src/utils/oqlCalculator';
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
    assert.equal(top5[0].barLabel, '2 (4.00%)');
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
    assert.equal(cle5.currentLabel, '1 (2.00%)');
    assert.equal(cle5.previous, 2);
    assert.equal(cle5.previousLabel, '2 (4.00%)');
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
    assert.equal(formatQtyAndPct(3, 37.5), '3 (37.50%)');
  });

  it('getFiscalWeekInfo starts August at W32 and computeWeeklyOqlTrend sorts W32->W52->W01 chronologically', () => {
    const augStart = getFiscalWeekInfo('2026-08-01', 8);
    assert.equal(augStart.fiscalYear, 'FY26/27');
    assert.equal(augStart.weekLabel, 'W32');
    assert.equal(augStart.fyOrder, 0);

    const janMid = getFiscalWeekInfo('2027-01-05', 8);
    assert.equal(janMid.fiscalYear, 'FY26/27');
    assert.ok(janMid.weekNumber < 32, 'January must wrap past W52 into W01..W31');
    assert.ok(janMid.fyOrder > augStart.fyOrder);

    const trend = computeWeeklyOqlTrend(
      [
        makeReport({ id: 'w-jan', inspectionDate: '2027-01-05', inspectedQuantity: 100, totalDefectQuantity: 3 }),
        makeReport({ id: 'w-aug', inspectionDate: '2026-08-03', inspectedQuantity: 100, totalDefectQuantity: 5 }),
      ],
      8
    );

    assert.equal(trend.length, 2);
    assert.equal(trend[0].weekLabel, 'W32');
    assert.equal(trend[0].oql, 5);
    assert.equal(trend[1].oql, 3);
    assert.ok(trend[1].fyOrder > trend[0].fyOrder);
  });

  it('computeFloorStats counts distinct styles & floor totals and findDuplicateReportIds flags duplicates', () => {
    const reports: InspectionReport[] = [
      makeReport({
        id: 'r1',
        reportNumber: 'R-100',
        orderNumber: 'NOF1',
        styleNumber: '22031973',
        floor: 'SEW-01',
        inspectionDate: '2026-10-10',
        updatedAt: '2026-10-10T10:00:00Z',
      }),
      makeReport({
        id: 'r2',
        reportNumber: 'R-101',
        orderNumber: 'NOF2',
        styleNumber: '22031973',
        floor: 'SEW-2',
        inspectionDate: '2026-10-11',
        updatedAt: '2026-10-11T10:00:00Z',
      }),
      makeReport({
        id: 'r3-dup',
        reportNumber: 'R-100',
        orderNumber: 'NOF1',
        styleNumber: '22031973',
        floor: 'SEW-1',
        inspectionDate: '2026-10-10',
        updatedAt: '2026-10-09T10:00:00Z',
      }),
    ];

    const stats = computeFloorStats(reports);
    assert.equal(stats.distinctStyleCount, 1);
    assert.equal(stats.byFloor.find((f) => f.floor === 'SEW-1')?.reportCount, 2);
    assert.equal(stats.byFloor.find((f) => f.floor === 'SEW-2')?.reportCount, 1);

    const reportsWithRepeatInspections: InspectionReport[] = [
      ...reports,
      // Same style & same date & same Inline stage, but 2nd re-inspection has different defect count -> NOT duplicate
      makeReport({
        id: 'r4-inline-1',
        reportNumber: 'R-200',
        orderNumber: 'NOF5',
        styleNumber: '22031973',
        inspectionType: 'Inline',
        inspectionDate: '2026-10-12',
        inspectedQuantity: 50,
        totalDefectQuantity: 4,
      }),
      makeReport({
        id: 'r5-inline-2',
        reportNumber: 'R-200',
        orderNumber: 'NOF5',
        styleNumber: '22031973',
        inspectionType: 'Inline',
        inspectionDate: '2026-10-12',
        inspectedQuantity: 50,
        totalDefectQuantity: 1,
      }),
    ];

    const dups = findDuplicateReportIds(reportsWithRepeatInspections);
    assert.deepEqual(dups, ['r3-dup']);
  });

  it('filterReports supports multi-FY arrays, multi-floor arrays, and BSQC/AQC reportSource', () => {
    const reports: InspectionReport[] = [
      makeReport({
        id: 'fy25-bsqc',
        inspectionDate: '2026-05-10',
        floor: 'SEW-1',
        reportSource: 'BSQC',
      }),
      makeReport({
        id: 'fy26-aqc',
        inspectionDate: '2026-10-10',
        floor: 'SEW-2',
        reportSource: 'AQC',
      }),
      makeReport({
        id: 'fy26-bsqc-s3',
        inspectionDate: '2026-10-12',
        floor: 'SEW-3',
        reportSource: 'BSQC',
      }),
    ];

    const fy26Only = filterReports(reports, { financialYear: ['FY26/27'] }, 8);
    assert.equal(fy26Only.length, 2);

    const bothFys = filterReports(reports, { financialYear: ['FY25/26', 'FY26/27'] }, 8);
    assert.equal(bothFys.length, 3);

    const sew2Aqc = filterReports(
      reports,
      { financialYear: ['FY26/27'], floors: ['SEW-2'], reportSource: 'AQC' },
      8
    );
    assert.equal(sew2Aqc.length, 1);
    assert.equal(sew2Aqc[0].id, 'fy26-aqc');
  });
});
