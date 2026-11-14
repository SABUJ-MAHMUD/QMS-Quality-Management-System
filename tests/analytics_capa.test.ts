import test from 'node:test';
import assert from 'node:assert/strict';
import { filterReports } from '../src/utils/oqlCalculator.ts';
import { sanitizeForFirestore } from '../src/utils/firestoreSanitizer.ts';
import type { InspectionReport } from '../src/types/index.ts';

const sampleReports: InspectionReport[] = [
  {
    id: 'rep-1',
    reportNumber: 'NOF4705853',
    orderNumber: 'NOF4705853',
    styleNumber: '22013782',
    styleName: 'ONSMATT LONGY SS TEE 3-PACK NOOS',
    buyer: 'ONLY&SONS',
    factory: 'NORTHERN FASHION LTD.',
    inspector: 'Rifat Chowdhury',
    inspectionDate: '2026-11-03',
    targetMonth: '2026-11',
    inspectionType: 'Final',
    color: 'Assorted',
    productDescription: 'ONSMATT LONGY SS TEE 3-PACK NOOS',
    orderQuantity: 4000,
    inspectedQuantity: 50,
    criticalDefectQuantity: 0,
    majorDefectQuantity: 2,
    minorDefectQuantity: 2,
    totalDefectQuantity: 4,
    oql: 8.0,
    inspectionResult: 'PASSED',
    inspectionLevel: 'AQL 2.5/2.5 Level II Reduced',
    extractionStatus: 'Extracted',
    validationStatus: 'Approved',
    defects: [
      {
        id: 'd-1',
        inspectionReportId: 'rep-1',
        defectGroupId: 'dg-po',
        originalDefectName: 'Po-2 Shaped poorly.',
        standardDefectName: 'Pocket / flap poorly shaped',
        classificationStatus: 'Auto-Matched',
        severity: 'Major',
        defectQuantity: 1,
        createdAt: '2026-11-03T10:00:00.000Z',
      },
      {
        id: 'd-2',
        inspectionReportId: 'rep-1',
        defectGroupId: 'dg-se',
        originalDefectName: 'Se-10 Broken stitching.',
        standardDefectName: 'Broken stitching / Ruptured seam',
        classificationStatus: 'Auto-Matched',
        severity: 'Major',
        defectQuantity: 1,
        createdAt: '2026-11-03T10:00:00.000Z',
      },
    ],
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 'rep-2',
    reportNumber: 'NOF4693896',
    orderNumber: 'NOF4693896',
    styleNumber: '13255895',
    styleName: 'NMFBELINA 3P SS TOP PB',
    buyer: 'NAME IT',
    factory: 'NORTHERN FASHION LTD.',
    inspector: 'Salah Uddin',
    inspectionDate: '2026-11-03',
    targetMonth: '2026-11',
    inspectionType: 'Inline',
    color: 'Assorted',
    productDescription: 'NMFBELINA 3P SS TOP PB',
    orderQuantity: 400,
    inspectedQuantity: 50,
    criticalDefectQuantity: 0,
    majorDefectQuantity: 2,
    minorDefectQuantity: 0,
    totalDefectQuantity: 2,
    oql: 4.0,
    inspectionResult: 'PASSED',
    inspectionLevel: 'AQL 2.5/2.5 Level II Reduced',
    extractionStatus: 'Extracted',
    validationStatus: 'Approved',
    defects: [
      {
        id: 'd-3',
        inspectionReportId: 'rep-2',
        defectGroupId: 'dg-cle',
        originalDefectName: 'Cle-5 Oil spots or stains (cannot be removed).',
        standardDefectName: 'Oil spots or stains (cannot be removed)',
        classificationStatus: 'Auto-Matched',
        severity: 'Major',
        defectQuantity: 1,
        createdAt: '2026-11-03T11:00:00.000Z',
      },
      {
        id: 'd-4',
        inspectionReportId: 'rep-2',
        defectGroupId: 'dg-se',
        originalDefectName: 'Se-9 Seam twisted, puckered or pleated.',
        standardDefectName: 'Seam twisted, puckered or pleated',
        classificationStatus: 'Auto-Matched',
        severity: 'Major',
        defectQuantity: 1,
        createdAt: '2026-11-03T11:00:00.000Z',
      },
    ],
    createdAt: '2026-11-03T11:00:00.000Z',
    updatedAt: '2026-11-03T11:00:00.000Z',
  },
];

test('filterReports matches 23 master category names ("Cleanliness", "Seams and stitching") and sub-defects', () => {
  const cleanlinessFiltered = filterReports(sampleReports, { defectGroup: 'Cleanliness' });
  assert.equal(cleanlinessFiltered.length, 1);
  assert.equal(cleanlinessFiltered[0].orderNumber, 'NOF4693896');

  const seamFiltered = filterReports(sampleReports, { defectGroup: 'Seams and stitching' });
  assert.equal(seamFiltered.length, 2);

  const subDefectFiltered = filterReports(sampleReports, {
    defectGroup: 'Broken stitching / Ruptured seam',
  });
  assert.equal(subDefectFiltered.length, 1);
  assert.equal(subDefectFiltered[0].orderNumber, 'NOF4705853');

  const fabricFiltered = filterReports(sampleReports, { defectGroup: 'Fabric Defects' });
  assert.equal(fabricFiltered.length, 0);
});

test('sanitizeForFirestore strips undefined fields and converts NaN/Infinity to 0 cleanly', () => {
  const dirty = {
    id: 'rep-x',
    optionalNote: undefined,
    oql: Number.NaN,
    nested: [{ qty: 2, empty: undefined }],
  };
  const cleaned = sanitizeForFirestore(dirty);
  assert.equal('optionalNote' in cleaned, false);
  assert.equal(cleaned.oql, 0);
  assert.equal('empty' in cleaned.nested[0], false);
  assert.equal(cleaned.nested[0].qty, 2);
});
