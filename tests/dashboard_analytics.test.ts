import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CAPARecord, InspectionReport, InspectionDefect } from '../src/types';
import {
  computeTopSingleDefects,
  computeMonthToMonthTopDefects,
  computeWeeklyOqlTrend,
  computeFloorStats,
  findDuplicateReportIds,
  buildDefaultCapaGuidance,
  computeDynamicCapaRows,
  selectDashboardCapaRows,
  buildAvailableWeeks,
  formatQtyAndPct,
  weekOverlapsAnyMonth,
  formatSelectedPeriodLabel,
} from '../src/utils/dashboardAnalytics';
import { getFiscalWeekInfo, filterReports, formatWeekDateRange, normalizeMultiSelect } from '../src/utils/oqlCalculator';
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

  it('getFiscalWeekInfo uses ISO Monday–Sunday schedule (Week 47 2026 = Nov 16 - Nov 22) and computeWeeklyOqlTrend sorts chronologically', () => {
    // Exact BESTSELLER portal screenshot verification: Week 47, 2026 = Mon Nov 16 - Sun Nov 22
    const nov16Mon = getFiscalWeekInfo('2026-11-16', 8);
    const nov20Fri = getFiscalWeekInfo('2026-11-20', 8);
    const nov22Sun = getFiscalWeekInfo('2026-11-22', 8);
    assert.equal(nov16Mon.weekLabel, 'W47');
    assert.equal(nov16Mon.weekKey, '2026-W47');
    assert.equal(nov16Mon.weekStartDate, '2026-11-16');
    assert.equal(nov16Mon.weekEndDate, '2026-11-22');
    assert.equal(formatWeekDateRange(nov16Mon.weekStartDate, nov16Mon.weekEndDate), 'Nov 16 - Nov 22, 2026');
    assert.equal(nov20Fri.weekKey, '2026-W47');
    assert.equal(nov22Sun.weekKey, '2026-W47');

    // Adjacent Sunday -> Monday boundaries belong to adjacent weeks
    const nov15Sun = getFiscalWeekInfo('2026-11-15', 8);
    const nov23Mon = getFiscalWeekInfo('2026-11-23', 8);
    assert.equal(nov15Sun.weekLabel, 'W46');
    assert.equal(nov15Sun.weekStartDate, '2026-11-09');
    assert.equal(nov15Sun.weekEndDate, '2026-11-15');
    assert.equal(nov23Mon.weekLabel, 'W48');
    assert.equal(nov23Mon.weekStartDate, '2026-11-23');
    assert.equal(nov23Mon.weekEndDate, '2026-11-29');

    // August cycle & year-boundary ISO weeks (2026 has 53 ISO weeks; 2027-01-03 is Sun of 2026-W53)
    const aug3Mon = getFiscalWeekInfo('2026-08-03', 8);
    assert.equal(aug3Mon.fiscalYear, 'FY26/27');
    assert.equal(aug3Mon.weekLabel, 'W32');
    assert.equal(aug3Mon.weekStartDate, '2026-08-03');
    assert.equal(aug3Mon.weekEndDate, '2026-08-09');

    const jan3Sun = getFiscalWeekInfo('2027-01-03', 8);
    assert.equal(jan3Sun.weekKey, '2026-W53');
    assert.equal(jan3Sun.weekStartDate, '2026-12-28');
    assert.equal(jan3Sun.weekEndDate, '2027-01-03');

    const jan5Tue = getFiscalWeekInfo('2027-01-05', 8);
    assert.equal(jan5Tue.fiscalYear, 'FY26/27');
    assert.equal(jan5Tue.weekKey, '2027-W01');
    assert.equal(jan5Tue.weekStartDate, '2027-01-04');
    assert.equal(jan5Tue.weekEndDate, '2027-01-10');
    assert.ok(jan5Tue.fyOrder > nov16Mon.fyOrder);
    assert.ok(nov16Mon.fyOrder > aug3Mon.fyOrder);

    // computeWeeklyOqlTrend groups Mon-Sun and sorts chronologically W32 -> W47 -> W53 -> W01
    // Note: OQL uses Major + Minor only while `defects` retains Critical + Major + Minor
    const historicalReports: InspectionReport[] = [
      makeReport({
        id: 'w-jan',
        inspectionDate: '2027-01-05',
        inspectedQuantity: 100,
        criticalDefectQuantity: 0,
        majorDefectQuantity: 2,
        minorDefectQuantity: 1,
        totalDefectQuantity: 3,
      }),
      makeReport({
        id: 'w-w53-sun',
        inspectionDate: '2027-01-03',
        inspectedQuantity: 100,
        criticalDefectQuantity: 1,
        majorDefectQuantity: 3,
        minorDefectQuantity: 1,
        totalDefectQuantity: 5,
      }),
      makeReport({
        id: 'w-nov-mon',
        inspectionDate: '2026-11-16',
        inspectedQuantity: 50,
        criticalDefectQuantity: 0,
        majorDefectQuantity: 1,
        minorDefectQuantity: 1,
        totalDefectQuantity: 2,
      }),
      makeReport({
        id: 'w-nov-sun',
        inspectionDate: '2026-11-22',
        inspectedQuantity: 50,
        criticalDefectQuantity: 2,
        majorDefectQuantity: 4,
        minorDefectQuantity: 2,
        totalDefectQuantity: 8,
      }),
      makeReport({
        id: 'w-aug',
        inspectionDate: '2026-08-03',
        inspectedQuantity: 100,
        criticalDefectQuantity: 0,
        majorDefectQuantity: 3,
        minorDefectQuantity: 2,
        totalDefectQuantity: 5,
      }),
    ];

    const trend = computeWeeklyOqlTrend(historicalReports, 8);
    assert.equal(trend.length, 4);
    assert.deepEqual(
      trend.map((t) => t.weekLabel),
      ['W32', 'W47', 'W53', 'W01']
    );
    assert.equal(trend[0].oql, 5);
    assert.equal(trend[1].defects, 10, 'W47 Total defects preserves Critical+Major+Minor (2 + 8 = 10)');
    assert.equal(trend[1].oql, 8, 'W47 OQL uses Major+Minor only: (1+1 + 4+2) / 100 = 8% (Critical=2 excluded)');
    assert.equal(trend[1].dateRangeLabel, 'Nov 16 - Nov 22, 2026');
    assert.equal(trend[2].defects, 5, 'W53 preserves all 5 total defects including 1 Critical');
    assert.equal(trend[2].oql, 4, 'W53 OQL excludes 1 Critical: (3+1)/100 = 4%');
    assert.equal(trend[3].oql, 3);

    // filterReports & buildAvailableWeeks strictly apply Monday-Sunday schedule to existing reports
    const w47Filtered = filterReports(historicalReports, { week: '2026-W47' }, 8);
    assert.equal(w47Filtered.length, 2);
    assert.deepEqual(
      w47Filtered.map((r) => r.id).sort(),
      ['w-nov-mon', 'w-nov-sun']
    );

    const allWeeks = buildAvailableWeeks(historicalReports, 8, 'ALL');
    assert.equal(allWeeks.length, 4);
    assert.equal(allWeeks[0].weekKey, '2027-W01', 'Newest week sorted first');
    const w47Option = allWeeks.find((w) => w.weekKey === '2026-W47')!;
    assert.equal(w47Option.optionLabel, 'W47 (Nov 16 - Nov 22, 2026)');
    assert.equal(w47Option.reportCount, 2);

    const novWeeks = buildAvailableWeeks(historicalReports, 8, '2026-11');
    assert.deepEqual(novWeeks.map((w) => w.weekKey), ['2026-W47']);
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

  it('computeDynamicCapaRows & selectDashboardCapaRows dynamically rank highest defect first per filter slice while preserving saved CAPA guidance', () => {
    const reports: InspectionReport[] = [
      makeReport({
        id: 'r-sew1-oct',
        reportNumber: 'R-SEW1-OCT',
        orderNumber: 'NOF101',
        styleNumber: 'ST-A',
        floor: 'SEW-1',
        reportSource: 'BSQC',
        inspectionDate: '2026-10-10',
        targetMonth: '2026-10',
        defects: [
          makeDefect({
            id: 'd1',
            originalDefectName: 'Cle-1: Spot, stain, and soil marks',
            standardDefectName: 'Spot, stain, and soil marks',
            defectQuantity: 5,
          }),
          makeDefect({
            id: 'd2',
            originalDefectName: 'Se-2: Skipped stitch',
            standardDefectName: 'Skipped stitch',
            defectQuantity: 2,
          }),
        ],
      }),
      makeReport({
        id: 'r-sew2-nov-aqc',
        reportNumber: 'R-SEW2-NOV',
        orderNumber: 'NOF202',
        styleNumber: 'ST-B',
        floor: 'SEW-2',
        reportSource: 'AQC',
        inspectionDate: '2026-11-05',
        targetMonth: '2026-11',
        defects: [
          makeDefect({
            id: 'd3',
            originalDefectName: 'Ne-1: Incorrect Neckline and half-moon shape',
            standardDefectName: 'Incorrect Neckline and half-moon shape',
            defectQuantity: 4,
          }),
          makeDefect({
            id: 'd4',
            originalDefectName: 'Cle-1: Spot, stain, and soil marks',
            standardDefectName: 'Spot, stain, and soil marks',
            defectQuantity: 1,
          }),
        ],
      }),
    ];

    const savedCapas: CAPARecord[] = [
      {
        id: 'saved-cle1',
        capaId: 'CAPA-2026-001',
        inspectionReportId: 'r-sew1-oct',
        reportNumber: '99 Reports Combined',
        orderNumber: 'NOF999',
        styleNumber: 'OLD',
        buyer: 'BESTSELLER',
        defectName: 'Cle-1: Spot, stain, and soil marks',
        defectGroup: 'Cleanliness',
        defectSeverity: 'Major',
        defectQuantity: 26, // stale global snapshot qty
        rootCause: 'Custom engineer oil shield root cause',
        fiveWhyAnalysis: { why1: 'W1', why2: 'W2', why3: 'W3', why4: 'W4', why5: 'W5' },
        correction: 'Clean lot',
        correctiveAction: 'Custom CA for Cle-1',
        preventiveAction: 'Custom PA for Cle-1',
        responsiblePerson: 'Md. Salah Uddin',
        responsibleDepartment: 'Finishing',
        targetCompletionDate: '2026-11-30',
        monitoringFrequency: 'Daily',
        monitoringMethod: 'Audit',
        capaStatus: 'In Progress',
        effectivenessStatus: 'Effective',
        showOnDashboard: true,
        isDemo: false,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    // 1. All reports: computeDynamicCapaRows ranks Cle-1 (5+1=6) > Ne-1 (4) > Se-2 (2)
    //    selectDashboardCapaRows shows only pushed/pinned items in the active slice (Cle-1)
    const allDynamic = computeDynamicCapaRows(reports, savedCapas);
    assert.equal(allDynamic[0].code, 'Cle-1');
    assert.equal(allDynamic[0].capaRecord.defectQuantity, 6);
    assert.equal(allDynamic[0].capaRecord.rootCause, 'Custom engineer oil shield root cause');
    assert.equal(allDynamic[0].capaRecord.capaStatus, 'In Progress');
    assert.equal(allDynamic[0].capaRecord.reportNumber, '2 Reports Combined');

    const allDash = selectDashboardCapaRows(allDynamic);
    assert.equal(allDash.length, 1);
    assert.equal(allDash[0].code, 'Cle-1');

    // 2. If Ne-1 is also pinned (+ Push to Dashboard), under SEW-2 slice Ne-1 (Qty 4) automatically ranks SL #1 above Cle-1 (Qty 1)
    const savedWithBothPinned: CAPARecord[] = [
      ...savedCapas,
      {
        ...savedCapas[0],
        id: 'saved-ne1',
        capaId: 'CAPA-2026-002',
        defectName: 'Ne-1: Incorrect Neckline and half-moon shape',
        defectQuantity: 4,
        showOnDashboard: true,
      },
    ];

    const sew2Slice = filterReports(
      reports,
      { floors: ['SEW-2'], reportSource: 'AQC', month: '2026-11', styleNumber: 'ST-B' },
      8
    );
    const sew2Dynamic = computeDynamicCapaRows(sew2Slice, savedWithBothPinned);
    assert.equal(sew2Dynamic.length, 2);
    assert.equal(sew2Dynamic[0].code, 'Ne-1', 'Ne-1 must rank at SL #1 for SEW-2 slice');
    assert.equal(sew2Dynamic[0].capaRecord.defectQuantity, 4);
    assert.equal(sew2Dynamic[1].code, 'Cle-1');
    assert.equal(sew2Dynamic[1].capaRecord.defectQuantity, 1, 'Cle-1 quantity must recalculate to slice count 1, not global 26');

    const sew2Dash = selectDashboardCapaRows(sew2Dynamic);
    assert.equal(sew2Dash.length, 2);
    assert.equal(sew2Dash[0].code, 'Ne-1', 'Dashboard RCA & CAPA SL #1 must auto-promote Ne-1 above Cle-1');
    assert.equal(sew2Dash[0].capaRecord.defectQuantity, 4);
    assert.equal(sew2Dash[1].code, 'Cle-1');

    // 3. Unpinned items NEVER sneak onto Dashboard; unpinning Cle-1 removes it cleanly
    const sew2OnlyCleUnpinned = computeDynamicCapaRows(sew2Slice, savedCapas.map((c) => ({ ...c, showOnDashboard: false })));
    assert.equal(sew2OnlyCleUnpinned[0].code, 'Ne-1', 'RCA & CAPA list still ranks Ne-1 first highest-to-lowest');
    assert.deepEqual(selectDashboardCapaRows(sew2OnlyCleUnpinned), [], 'Unpinned defects must not appear on Dashboard');

    // 4. Empty slice returns [] cleanly when includeUnmatchedSaved is false/omitted
    const emptyDynamic = computeDynamicCapaRows([], savedWithBothPinned, { includeUnmatchedSaved: false });
    assert.deepEqual(emptyDynamic, []);
    assert.deepEqual(selectDashboardCapaRows(emptyDynamic), []);
  });

  it('filterReports, buildAvailableWeeks, computeMonthToMonthTopDefects support multi-select Month and Week arrays', () => {
    const reports: InspectionReport[] = [
      makeReport({ id: 'sep', inspectionDate: '2026-09-14', targetMonth: '2026-09', inspectedQuantity: 50, totalDefectQuantity: 2 }),
      makeReport({ id: 'oct-w42', inspectionDate: '2026-10-14', targetMonth: '2026-10', inspectedQuantity: 50, totalDefectQuantity: 3 }),
      makeReport({ id: 'nov-w46', inspectionDate: '2026-11-11', targetMonth: '2026-11', inspectedQuantity: 50, totalDefectQuantity: 1 }),
      makeReport({
        id: 'nov-w47',
        inspectionDate: '2026-11-18',
        targetMonth: '2026-11',
        inspectedQuantity: 50,
        totalDefectQuantity: 4,
        defects: [
          makeDefect({
            id: 'd-se2',
            originalDefectName: 'Se-2: Skipped stitch',
            standardDefectName: 'Skipped stitch',
            defectQuantity: 4,
          }),
        ],
      }),
    ];

    assert.deepEqual(normalizeMultiSelect('ALL'), []);
    assert.deepEqual(normalizeMultiSelect(['2026-10', '2026-11', 'ALL']), ['2026-10', '2026-11']);

    // Multi-month filtering combines Oct + Nov
    const octNov = filterReports(reports, { month: ['2026-10', '2026-11'] }, 8);
    assert.deepEqual(
      octNov.map((r) => r.id),
      ['oct-w42', 'nov-w46', 'nov-w47']
    );

    // Multi-week filtering combines W42 + W47
    const twoWeeks = filterReports(reports, { week: ['2026-W42', '2026-W47'] }, 8);
    assert.deepEqual(
      twoWeeks.map((r) => r.id),
      ['oct-w42', 'nov-w47']
    );

    // Combined multi-month + multi-week
    const multiBoth = filterReports(reports, { month: ['2026-11'], week: ['2026-W46', '2026-W47'] }, 8);
    assert.deepEqual(
      multiBoth.map((r) => r.id),
      ['nov-w46', 'nov-w47']
    );

    // buildAvailableWeeks accepts multi-month array
    const sepAndNovWeeks = buildAvailableWeeks(reports, 8, ['2026-09', '2026-11']);
    assert.deepEqual(
      sepAndNovWeeks.map((w) => w.weekKey),
      ['2026-W47', '2026-W46', '2026-W38']
    );

    // weekOverlapsAnyMonth checks whether a week touches any selected month
    const w47 = sepAndNovWeeks.find((w) => w.weekKey === '2026-W47')!;
    assert.equal(weekOverlapsAnyMonth(w47, ['2026-10', '2026-11']), true);
    assert.equal(weekOverlapsAnyMonth(w47, ['2026-09']), false);

    // computeMonthToMonthTopDefects uses newest selected month when passed an array
    const comparison = computeMonthToMonthTopDefects(reports, ['2026-10', '2026-11'], new Date('2026-11-20T12:00:00Z'), 5);
    assert.equal(comparison.currMonthKey, '2026-11');
    assert.equal(comparison.prevMonthKey, '2026-10');

    // formatSelectedPeriodLabel handles multi-month and multi-week safely
    assert.equal(formatSelectedPeriodLabel(['2026-10', '2026-11'], 'ALL'), '2026-10, 2026-11');
    assert.ok(formatSelectedPeriodLabel('2026-11', ['2026-W46', '2026-W47'], sepAndNovWeeks)?.includes('W46'));
  });
});
