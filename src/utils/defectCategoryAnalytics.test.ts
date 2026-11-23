import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMasterCategoryStats,
  filterAndSortMasterCategoryStats,
} from './defectCategoryAnalytics';
import { InspectionReport } from '../types';

function makeReportWithDefects(
  id: string,
  defects: Array<{ codeName: string; standardName?: string; groupId?: string; qty: number }>
): InspectionReport {
  return {
    id,
    buyer: 'BESTSELLER',
    brand: 'ONLY',
    factory: 'Northern Fashions Ltd.',
    reportNumber: `REP-${id}`,
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
    majorDefectQuantity: defects.reduce((s, d) => s + d.qty, 0),
    minorDefectQuantity: 0,
    totalDefectQuantity: defects.reduce((s, d) => s + d.qty, 0),
    oql: defects.reduce((s, d) => s + d.qty, 0),
    inspectionResult: 'PASSED',
    inspectionLevel: 'AQL 2.5',
    defects: defects.map((d, idx) => ({
      id: `${id}-def-${idx}`,
      inspectionReportId: id,
      originalDefectName: d.codeName,
      standardDefectName: d.standardName || d.codeName,
      defectGroupId: d.groupId || '',
      severity: 'Major',
      defectQuantity: d.qty,
      classificationStatus: 'Auto-Matched',
      createdAt: '2026-11-18T10:00:00.000Z',
    })),
    extractionStatus: 'Extracted',
    validationStatus: 'Approved',
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  };
}

test('computeMasterCategoryStats sorts individual defects highest-first inside EVERY category group', () => {
  const reports: InspectionReport[] = [
    makeReportWithDefects('r1', [
      { codeName: 'Se-1: Missing stitch', qty: 2 },
      { codeName: 'Se-10: Broken stitching', qty: 8 },
      { codeName: 'Se-9: Seam twisted', qty: 15 },
      { codeName: 'Cle-5: Oil spots or stains (cannot be removed)', qty: 6 },
      { codeName: 'Cle-1: Spot, stain, and soil marks', qty: 1 },
      { codeName: 'La-9: Care label missing', qty: 4 },
      { codeName: 'La-1: Main label missing', qty: 1 },
    ]),
    makeReportWithDefects('r2', [
      { codeName: 'Se-9: Seam twisted', qty: 5 },
      { codeName: 'Cle-5: Oil spots or stains (cannot be removed)', qty: 3 },
    ]),
  ];

  const stats = computeMasterCategoryStats(reports);
  const sortedCategories = filterAndSortMasterCategoryStats(stats, {
    showOnlyActive: false,
    searchTerm: '',
  });

  // Outer categories auto-sorted descending: Se (30) -> Cle (10) -> La (5)
  assert.equal(sortedCategories[0].code, 'Se');
  assert.equal(sortedCategories[0].totalQuantityAffected, 30);
  assert.equal(sortedCategories[1].code, 'Cle');
  assert.equal(sortedCategories[1].totalQuantityAffected, 10);
  assert.equal(sortedCategories[2].code, 'La');
  assert.equal(sortedCategories[2].totalQuantityAffected, 5);

  // Inside Se group: Se-9 (20) -> Se-10 (8) -> Se-1 (2) -> 0-defect items
  const seSub = sortedCategories[0].subStats;
  assert.equal(seSub[0].code, 'Se-9');
  assert.equal(seSub[0].quantityAffected, 20);
  assert.equal(seSub[1].code, 'Se-10');
  assert.equal(seSub[1].quantityAffected, 8);
  assert.equal(seSub[2].code, 'Se-1');
  assert.equal(seSub[2].quantityAffected, 2);
  assert.equal(seSub[3].quantityAffected, 0);

  // Inside Cle group: Cle-5 (9) -> Cle-1 (1) -> 0-defect items
  const cleSub = sortedCategories[1].subStats;
  assert.equal(cleSub[0].code, 'Cle-5');
  assert.equal(cleSub[0].quantityAffected, 9);
  assert.equal(cleSub[1].code, 'Cle-1');
  assert.equal(cleSub[1].quantityAffected, 1);

  // Inside La group: La-9 (4) -> La-1 (1) -> 0-defect items
  const laSub = sortedCategories[2].subStats;
  assert.equal(laSub[0].code, 'La-9');
  assert.equal(laSub[0].quantityAffected, 4);
  assert.equal(laSub[1].code, 'La-1');
  assert.equal(laSub[1].quantityAffected, 1);
});
