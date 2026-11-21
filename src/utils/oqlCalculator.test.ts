import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReportOql,
  calculateAggregatedOql,
  getReportOqlDefects,
  getReportOql,
  calculateOqlTargetVariation,
  calculateReductionPercentage,
  getFinancialYear,
  computeParetoAnalysis,
  normalizeReportSourceSelection,
  buildResetFilterState,
} from './oqlCalculator';

test('calculateReportOql satisfies BESTSELLER formula for single inspection', () => {
  // Example from prompt:
  // Critical Defects = 5, Major = 15, Minor = 10 -> Total = 30
  // Inspected Qty = 520
  // OQL = (30 / 520) * 100 = 5.76923...% -> 5.77%
  const oql = calculateReportOql(30, 520);
  assert.equal(oql, 5.77);
});

test('calculateReportOql handles zero inspection quantity safely without crashing', () => {
  assert.equal(calculateReportOql(5, 0), 0);
  assert.equal(calculateReportOql(0, 0), 0);
});

test('calculateAggregatedOql satisfies the sum-of-defects / sum-of-inspected rule', () => {
  // Example from prompt:
  // Inspection A: Defects = 30, Inspected Qty = 520
  // Inspection B: Defects = 20, Inspected Qty = 400
  // Total Defects = 50, Total Inspected Qty = 920
  // Aggregated OQL = (50 / 920) * 100 = 5.4347...% -> 5.43%
  const reports = [
    { totalDefectQuantity: 30, inspectedQuantity: 520 },
    { totalDefectQuantity: 20, inspectedQuantity: 400 },
  ];
  const aggregated = calculateAggregatedOql(reports);
  assert.equal(aggregated, 5.43);

  // Simple average would be (5.77 + 5.00)/2 = 5.385. Ensure it is NOT simple average!
  assert.notEqual(aggregated, 5.38);
});

test('getReportOql & calculateAggregatedOql use Major + Minor only while keeping Critical & Total Defects intact', () => {
  const reportWithCritical = {
    criticalDefectQuantity: 5,
    majorDefectQuantity: 10,
    minorDefectQuantity: 5,
    totalDefectQuantity: 20, // Critical + Major + Minor
    inspectedQuantity: 500,
  };
  assert.equal(reportWithCritical.totalDefectQuantity, 20);
  assert.equal(getReportOqlDefects(reportWithCritical), 15);
  assert.equal(getReportOql(reportWithCritical, 2), 3.0);

  // Critical-only defects give 0.00% OQL while total defects & critical count remain tracked
  const criticalOnly = {
    criticalDefectQuantity: 3,
    majorDefectQuantity: 0,
    minorDefectQuantity: 0,
    totalDefectQuantity: 3,
    inspectedQuantity: 100,
  };
  assert.equal(getReportOqlDefects(criticalOnly), 0);
  assert.equal(getReportOql(criticalOnly, 2), 0);

  // Aggregated check: Critical=1, Major=357, Minor=221, Total=579, Inspected=9190 -> 578/9190*100 = 6.29%
  const agg = calculateAggregatedOql([
    {
      criticalDefectQuantity: 1,
      majorDefectQuantity: 357,
      minorDefectQuantity: 221,
      totalDefectQuantity: 579,
      inspectedQuantity: 9190,
    },
  ]);
  assert.equal(agg, 6.29);
});

test('calculateOqlTargetVariation reports Miss/Not Achieved, Achieved, On Target, and No Data accurately', () => {
  const miss = calculateOqlTargetVariation(6.29, 4.5, true, 2);
  assert.equal(miss.delta, 1.79);
  assert.equal(miss.status, 'MISS');
  assert.equal(miss.shortLabel, 'Var: +1.79% (Not Achieved)');

  const achieved = calculateOqlTargetVariation(3.8, 4.5, true, 2);
  assert.equal(achieved.delta, -0.7);
  assert.equal(achieved.status, 'ACHIEVED');
  assert.equal(achieved.shortLabel, 'Var: -0.70% (Achieved)');

  const exact = calculateOqlTargetVariation(4.5, 4.5, true, 2);
  assert.equal(exact.delta, 0);
  assert.equal(exact.status, 'ON_TARGET');
  assert.equal(exact.shortLabel, 'Var: 0.00% (On Target)');

  const noData = calculateOqlTargetVariation(0, 4.5, false, 2);
  assert.equal(noData.status, 'NO_DATA');
  assert.equal(noData.shortLabel, 'Var: 0.00% (No Data)');
});

test('calculateReductionPercentage satisfies ((Prev - Curr) / Prev) * 100 and safe zero handling', () => {
  const reduction = calculateReductionPercentage(100, 35);
  assert.equal(reduction, 65);

  const reduction2 = calculateReductionPercentage(8, 2);
  assert.equal(reduction2, 75);

  // Safe handling of zero previous defect quantity
  assert.equal(calculateReductionPercentage(0, 5), null);
  assert.equal(calculateReductionPercentage(-5, 2), null);
});

test('getFinancialYear accurately calculates FY for August-July cycle', () => {
  // October 2026 is in FY26/27
  assert.equal(getFinancialYear('2026-10-15', 8), 'FY26/27');
  // August 2026 is in FY26/27
  assert.equal(getFinancialYear('2026-08-01', 8), 'FY26/27');
  // July 2026 is in FY25/26
  assert.equal(getFinancialYear('2026-07-31', 8), 'FY25/26');
  // January 2027 is in FY26/27
  assert.equal(getFinancialYear('2027-01-10', 8), 'FY26/27');
});

test('computeParetoAnalysis calculates descending defect rankings and cumulative %', () => {
  const sampleDefects = [
    { standardDefectName: 'Broken Stitching', defectQuantity: 8 },
    { standardDefectName: 'Oil Spot', defectQuantity: 6 },
    { standardDefectName: 'Uncut Thread', defectQuantity: 5 },
    { standardDefectName: 'Dirty Garment', defectQuantity: 4 },
    { standardDefectName: 'Seam Puckering', defectQuantity: 3 },
    { standardDefectName: 'Other Defects', defectQuantity: 4 },
  ];
  const pareto = computeParetoAnalysis(sampleDefects);
  assert.equal(pareto.length, 6);
  assert.equal(pareto[0].name, 'Broken Stitching');
  assert.equal(pareto[0].quantity, 8);
  // Total defects = 30
  // Broken Stitching = 8 / 30 = 26.7%
  assert.equal(pareto[0].percentage, 26.7);
  assert.equal(pareto[0].cumulativePercentage, 26.7);
  // Final cumulative must reach 100%
  assert.equal(pareto[pareto.length - 1].cumulativePercentage, 100);
});

test('normalizeReportSourceSelection and buildResetFilterState preserve BSQC/AQC/ALL and FY across Reset', () => {
  assert.equal(normalizeReportSourceSelection('BSQC'), 'BSQC');
  assert.equal(normalizeReportSourceSelection('AQC'), 'AQC');
  assert.equal(normalizeReportSourceSelection('ALL'), 'ALL');
  assert.equal(normalizeReportSourceSelection('invalid'), 'ALL');
  assert.equal(normalizeReportSourceSelection(null), 'ALL');

  const defaults = {
    buyer: 'ALL',
    financialYear: ['FY26/27'],
    floors: [],
    reportSource: 'ALL' as const,
    month: 'ALL',
    week: 'ALL',
    dateFrom: '',
    dateTo: '',
    orderNumber: '',
    styleNumber: '',
    defectGroup: 'ALL',
    defectSeverity: 'ALL',
    inspectionResult: 'ALL',
    searchQuery: '',
  };

  const resetWithBsqc = buildResetFilterState(
    {
      ...defaults,
      financialYear: ['FY25/26'],
      reportSource: 'BSQC',
      month: ['2026-10'],
      floors: ['SEW-1'],
      styleNumber: '22031973',
    },
    defaults
  );
  assert.equal(resetWithBsqc.reportSource, 'BSQC');
  assert.deepEqual(resetWithBsqc.financialYear, ['FY25/26']);
  assert.equal(resetWithBsqc.month, 'ALL');
  assert.deepEqual(resetWithBsqc.floors, []);
  assert.equal(resetWithBsqc.styleNumber, '');

  const resetWithAqc = buildResetFilterState(
    {
      ...defaults,
      reportSource: 'AQC',
      week: ['2026-W47'],
    },
    defaults
  );
  assert.equal(resetWithAqc.reportSource, 'AQC');
  assert.equal(resetWithAqc.week, 'ALL');
});

