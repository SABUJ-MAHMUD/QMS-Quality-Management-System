import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DATABASE_FILTERS,
  analyzeRepeatedStyleAndPo,
  countActiveDatabaseFilters,
  filterDatabaseReports,
} from './databaseFiltering';
import { InspectionReport } from '../types';

function makeReport(overrides: Partial<InspectionReport> = {}): InspectionReport {
  return {
    id: overrides.id || 'rep-1',
    buyer: 'BESTSELLER',
    brand: 'ONLY',
    factory: 'Northern Fashions Ltd.',
    reportNumber: 'NOF4700001 - 15388158 - SEW-1',
    reportSource: 'BSQC',
    inspectionType: 'Final',
    inspectionDate: '2026-11-18',
    orderNumber: 'NOF4700001',
    styleNumber: '15388158',
    floor: 'SEW-1',
    section: 'SEW-1',
    color: 'Black',
    productDescription: 'Test Garment',
    orderQuantity: 1000,
    inspectedQuantity: 100,
    criticalDefectQuantity: 0,
    majorDefectQuantity: 3,
    minorDefectQuantity: 1,
    totalDefectQuantity: 4,
    oql: 4.0,
    inspectionResult: 'PASSED',
    inspectionLevel: 'AQL 2.5',
    defects: [],
    extractionStatus: 'Extracted',
    validationStatus: 'Approved',
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: '2026-11-19T10:00:00.000Z',
    ...overrides,
  };
}

const sampleReports: InspectionReport[] = [
  makeReport({
    id: 'r1',
    inspectionType: 'Final',
    reportSource: 'BSQC',
    floor: 'SEW-1',
    brand: 'ONLY',
    styleNumber: '15388158',
    criticalDefectQuantity: 0,
    majorDefectQuantity: 3,
    minorDefectQuantity: 1,
    totalDefectQuantity: 4,
    inspectedQuantity: 100,
    oql: 4.0,
    inspectionResult: 'PASSED',
  }),
  makeReport({
    id: 'r2',
    inspectionType: 'Inline',
    reportSource: 'AQC',
    floor: 'SEW-2',
    brand: 'NAME IT',
    styleNumber: '13257457',
    criticalDefectQuantity: 2,
    majorDefectQuantity: 5,
    minorDefectQuantity: 0,
    totalDefectQuantity: 7,
    inspectedQuantity: 100,
    oql: 5.0,
    inspectionResult: 'FAILED',
  }),
  makeReport({
    id: 'r3',
    inspectionType: 'Final',
    reportSource: 'BSQC',
    floor: 'SEW-3',
    brand: 'ONLY&SONS',
    styleNumber: '22041282',
    criticalDefectQuantity: 0,
    majorDefectQuantity: 0,
    minorDefectQuantity: 2,
    totalDefectQuantity: 2,
    inspectedQuantity: 50,
    oql: 4.0,
    inspectionResult: 'PASSED',
  }),
];

test('filterDatabaseReports filters individually by Stage, Source, Floor, Brand, and Style', () => {
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, stageFilter: 'Inline' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, sourceFilter: 'BSQC' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r1', 'r3']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, floorFilter: 'SEW-3' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r3']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, brandFilter: 'NAME IT' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, styleFilter: '15388158' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r1']
  );
});

test('filterDatabaseReports filters by Crit, Maj, Min, OQL threshold (Maj+Min), and Result', () => {
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, critFilter: 'GT_ZERO' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, majFilter: 'ZERO' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r3']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, minFilter: 'ZERO' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, oqlFilter: 'ABOVE_TARGET' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterDatabaseReports(sampleReports, { ...DEFAULT_DATABASE_FILTERS, resultFilter: 'FAILED' }, { targetOql: 4.5 }).map((r) => r.id),
    ['r2']
  );
});

test('countActiveDatabaseFilters counts active filters accurately', () => {
  assert.equal(countActiveDatabaseFilters(DEFAULT_DATABASE_FILTERS), 0);
  assert.equal(
    countActiveDatabaseFilters({
      ...DEFAULT_DATABASE_FILTERS,
      stageFilter: 'Final',
      brandFilter: 'ONLY',
      oqlFilter: 'WITHIN_TARGET',
    }),
    3
  );
});

test('analyzeRepeatedStyleAndPo and repeatedOnly surface same-Style and same-PO reports together', () => {
  const reports: InspectionReport[] = [
    makeReport({ id: 'a1', styleNumber: '15388158', orderNumber: 'NOF4700001' }),
    makeReport({ id: 'a2', styleNumber: '15388158', orderNumber: 'NOF4700002', inspectionType: 'Inline' }),
    makeReport({ id: 'b1', styleNumber: '99999999', orderNumber: 'NOF4700099 + NOF4700001' }),
    makeReport({ id: 'u1', styleNumber: '77777777', orderNumber: 'NOF8888888' }),
  ];

  const analysis = analyzeRepeatedStyleAndPo(reports);
  assert.deepEqual(Array.from(analysis.repeatedIdSet).sort(), ['a1', 'a2', 'b1']);
  assert.equal(analysis.metaById.get('a1')?.styleCount, 2);
  assert.equal(analysis.metaById.get('a1')?.maxPoCount, 2);
  assert.equal(analysis.metaById.get('b1')?.maxPoCount, 2);
  assert.equal(analysis.repeatedIdSet.has('u1'), false);

  const filtered = filterDatabaseReports(
    reports,
    { ...DEFAULT_DATABASE_FILTERS, repeatedOnly: true },
    { targetOql: 4.5, repeatedIdSet: analysis.repeatedIdSet }
  );
  assert.deepEqual(filtered.map((r) => r.id), ['a1', 'a2', 'b1']);

  const legacyLabelReports: InspectionReport[] = [
    makeReport({ id: 'l1', styleNumber: '11111111', orderNumber: ', AQC Final: NOF1111111 - 2026 - SEW-3' }),
    makeReport({ id: 'l2', styleNumber: '22222222', orderNumber: ', AQC Final: NOF2222222 - 2026 - SEW-3' }),
  ];
  const legacyAnalysis = analyzeRepeatedStyleAndPo(legacyLabelReports);
  assert.equal(legacyAnalysis.repeatedIdSet.size, 0);
});
