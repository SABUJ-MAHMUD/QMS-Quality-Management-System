import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDataFromText } from '../src/utils/pdfParser.ts';
import {
  INITIAL_DEFECT_MASTER,
  INITIAL_DEFECT_GROUPS,
  classifyRawDefect,
} from '../src/data/defectMasterData.ts';
import { calculateReportOql } from '../src/utils/oqlCalculator.ts';

test('Compact defect codes CL5, CL1, NO1 normalize and classify into exact 23 Master Categories', () => {
  const cl5 = classifyRawDefect('CL5 Oil spots or stains (cannot be removed)');
  assert.equal(cl5.defectGroupId, 'dg-cle');
  assert.equal(cl5.standardDefectName, 'Oil spots or stains (cannot be removed)');

  const cl1 = classifyRawDefect('CL1 Spot, stain and soil marks');
  assert.equal(cl1.defectGroupId, 'dg-cle');
  assert.equal(cl1.standardDefectName, 'Spot, stain and soil marks');

  const no1 = classifyRawDefect('NO1 Incorrect Neckline and half-moon shape');
  assert.equal(no1.defectGroupId, 'dg-ne');
  assert.equal(no1.standardDefectName, 'Incorrect Neckline and half-moon shape');
});

test('BESTSELLER PDF extraction: Order Qty/Available & Planned Sample Qty/Inspected always pick 2nd number', () => {
  const sampleReportText = `
Inspection report, Final: NOF4789692
22028692: ONSMILO SS KNIT TEE
Supplier Name: NORTHERN FASHION LTD.
Brand: ONLY&SONS
Inspection Date: 11/08/2026
Inspector: Salah Uddin
Order Qty/Available: 3500 / 1840
Planned Sample Qty/Inspected: 125 / 50
Sampling Method: AQL 2.5/2.5 Level II Reduced
Inspector Conclusion: Approved

DEFECT DESCRIPTION CRITICAL MAJOR MINOR
CL5 Oil spots or stains (cannot be removed) - 2 -
CL1 Spot, stain, and soil marks - - 1
NO1 Incorrect Neckline and half-moon shape - 1 1
Cle-3 Untrimmed thread ends reverse side < 2 cm (m)/Untrimmed thread ends reverse side >2 cm (M) - 1 -
TOTAL 0 4 2
AQL MAX 0 3 5
  `;

  const draft = extractDataFromText(
    sampleReportText,
    '692.pdf',
    INITIAL_DEFECT_MASTER,
    INITIAL_DEFECT_GROUPS,
    '2026-11'
  );

  // Header & Identity checks
  assert.equal(draft.reportNumber, '692');
  assert.equal(draft.orderNumber, 'NOF4789692');
  assert.equal(draft.factory, 'NORTHERN FASHION LTD.');
  assert.equal(draft.styleNumber, '22028692');
  assert.equal(draft.styleName, 'ONSMILO SS KNIT TEE');
  assert.equal(draft.buyer, 'ONLY&SONS');
  assert.equal(draft.inspectionDate, '2026-08-11');
  assert.equal(draft.inspectionResult, 'PASSED');

  // Strict 2nd-number extraction for Order Qty/Available and Planned Sample Qty/Inspected
  assert.equal(draft.orderQuantity, 1840);
  assert.equal(draft.inspectedQuantity, 50);

  // Exact defect totals (TOTAL & AQL MAX rows excluded, numbers inside "< 2 cm" allowed)
  assert.equal(draft.criticalDefectQuantity, 0);
  assert.equal(draft.majorDefectQuantity, 4);
  assert.equal(draft.minorDefectQuantity, 2);
  assert.equal(draft.totalDefectQuantity, 6);

  // NO1 with both 1 Major and 1 Minor must preserve each severity separately
  const no1Major = draft.defects.find(
    (d) => d.originalDefectName.startsWith('NO1') && d.severity === 'Major'
  );
  const no1Minor = draft.defects.find(
    (d) => d.originalDefectName.startsWith('NO1') && d.severity === 'Minor'
  );
  assert.ok(no1Major && no1Major.defectQuantity === 1);
  assert.ok(no1Minor && no1Minor.defectQuantity === 1);

  // Exact OQL = (6 / 50) * 100 = 12.00%
  assert.equal(calculateReportOql(draft.totalDefectQuantity, Number(draft.inspectedQuantity)), 12.0);
});

test('Zero-defect inspection report does not fabricate fallback defects and handles 1200/1200 + multiple NOFs', () => {
  const zeroDefectText = `
Inspection report, Final: NOF4781001 + NOF4781002
22028692 ONSJACK SWEATSHIRT
Supplier Name: NORTHERN FASHIONS LTD.
Inspection Date: 2026-11-12
Order Qty/Available: 1200 / 1200
Planned Sample Qty/Inspected: 125 / 80
Sampling Method: AQL 2.5/2.5 Level II Reduced
Inspector Conclusion: Approved
TOTAL 0 0 0
  `;

  const draft = extractDataFromText(
    zeroDefectText,
    'Report_692_Zero.pdf',
    INITIAL_DEFECT_MASTER,
    INITIAL_DEFECT_GROUPS,
    '2026-11'
  );

  assert.equal(draft.orderNumber, 'NOF4781001 + NOF4781002');
  assert.equal(draft.orderQuantity, 1200);
  assert.equal(draft.inspectedQuantity, 80);
  assert.equal(draft.defects.length, 0);
  assert.equal(draft.totalDefectQuantity, 0);
  assert.equal(calculateReportOql(draft.totalDefectQuantity, Number(draft.inspectedQuantity)), 0);
});

test('Exact BESTSELLER Final report NOF4705853: filename never overrides Style Name, Nov 03 2026, Rifat Chowdhury, 200/50, 4000/4000, Po-2/Se-10/La-9/Ne-1', () => {
  const finalReportPipeLayout = `
Inspection report, Final: NOF4705853 | BESTSELLER
22013782: ONSMATT LONGY SS TEE 3-PACK NOOS
Online report
Inspector | Rifat Chowdhury | Inspection Date | Nov 03, 2026
Planned Sample Qty/Inspected | 200/50 | Order Qty/Available | 4000/4000
Location | 23° 59' 29" N x 90° 15' 25" E | Checklist Name | BS Inspection with AI Checkpoints
Planned Date | Nov 03, 2026 | Sampling Method | AQL 2.5/2.5 Level II Reduced
Supplier Name | NORTHERN FASHION LTD.
Inspector Conclusion | Approved | Final inspection result is accepted as per AQL.
SUMMARY
NOF4705853:22013782
1 Check for previous defects
2 Standard checklist
CRITICAL | MAJOR | MINOR
Po-2 Shaped poorly. | - | 1 | -
Se-10 Broken stitching. | - | 1 | -
La-9 Main label incorrectly placed. | - | - | 1
Ne-1 Incorrect Neckline and half-moon shape. | - | - | 1
TOTAL | 0 | 2 | 2
AQL MAX | 0 | 3 | 3
  `;

  const draft = extractDataFromText(
    finalReportPipeLayout,
    'NOF4705853 - 22013782 - Sew-01.pdf',
    INITIAL_DEFECT_MASTER,
    INITIAL_DEFECT_GROUPS,
    '2026-11'
  );

  assert.equal(draft.inspectionType, 'Final');
  assert.equal(draft.orderNumber, 'NOF4705853');
  assert.equal(draft.styleNumber, '22013782');
  assert.equal(draft.styleName, 'ONSMATT LONGY SS TEE 3-PACK NOOS');
  assert.equal(draft.buyer, 'ONLY&SONS');
  assert.equal(draft.inspector, 'Rifat Chowdhury');
  assert.equal(draft.inspectionDate, '2026-11-03');
  assert.equal(draft.inspectedQuantity, 50);
  assert.equal(draft.orderQuantity, 4000);
  assert.equal(draft.criticalDefectQuantity, 0);
  assert.equal(draft.majorDefectQuantity, 2);
  assert.equal(draft.minorDefectQuantity, 2);
  assert.equal(draft.totalDefectQuantity, 4);
  assert.equal(draft.defects.length, 4);

  const po2 = draft.defects.find((d) => d.originalDefectName.startsWith('Po-2'));
  const se10 = draft.defects.find((d) => d.originalDefectName.startsWith('Se-10'));
  const la9 = draft.defects.find((d) => d.originalDefectName.startsWith('La-9'));
  const ne1 = draft.defects.find((d) => d.originalDefectName.startsWith('Ne-1'));

  assert.equal(po2?.defectGroupId, 'dg-po');
  assert.equal(po2?.severity, 'Major');
  assert.equal(se10?.defectGroupId, 'dg-se');
  assert.equal(se10?.standardDefectName, 'Broken stitching / Ruptured seam');
  assert.equal(se10?.severity, 'Major');
  assert.equal(la9?.defectGroupId, 'dg-la');
  assert.equal(la9?.standardDefectName, 'Label placed in wrong position');
  assert.equal(la9?.severity, 'Minor');
  assert.equal(ne1?.defectGroupId, 'dg-ne');
  assert.equal(ne1?.severity, 'Minor');
});

test('Exact BESTSELLER Inline report NOF4693896: Inline stage, Salah Uddin, 125/50 -> 50, 1690/400 -> 400, wrapped multi-line Se-9', () => {
  const inlineReportPipeLayout = `
Inspection report, Inline: NOF4693896 | BESTSELLER
13255895: NMFBELINA 3P SS TOP PB
Online report
Inspector | Salah Uddin | Inspection Date | Nov 03, 2026
Planned Sample Qty/Inspected | 125/50 | Order Qty/Available | 1690/400
Location | 23° 59' 29" N x 90° 15' 25" E | Checklist Name | BS inspection Kids Wear with AI Checkpoints
Planned Date | Nov 03, 2026 | Sampling Method | AQL 2.5/2.5 Level II Reduced
Supplier Name | NORTHERN FASHION LTD.
Inspector Conclusion | Approved | Please take care for defective points found during inspection.
CRITICAL | MAJOR | MINOR
Cle-5 Oil spots or stains (cannot be removed). | - | 1 | -
Se-9 Seam twisted, puckered or pleated (other than specified) affecting the
appearance. | - | 1 | -
  `;

  const draft = extractDataFromText(
    inlineReportPipeLayout,
    'NOF4693896 - 13255895.pdf',
    INITIAL_DEFECT_MASTER,
    INITIAL_DEFECT_GROUPS,
    '2026-11'
  );

  assert.equal(draft.inspectionType, 'Inline');
  assert.equal(draft.orderNumber, 'NOF4693896');
  assert.equal(draft.styleNumber, '13255895');
  assert.equal(draft.styleName, 'NMFBELINA 3P SS TOP PB');
  assert.equal(draft.buyer, 'NAME IT');
  assert.equal(draft.inspector, 'Salah Uddin');
  assert.equal(draft.inspectionDate, '2026-11-03');
  assert.equal(draft.inspectedQuantity, 50);
  assert.equal(draft.orderQuantity, 400);
  assert.equal(draft.criticalDefectQuantity, 0);
  assert.equal(draft.majorDefectQuantity, 2);
  assert.equal(draft.minorDefectQuantity, 0);
  assert.equal(draft.totalDefectQuantity, 2);
  assert.equal(draft.defects.length, 2);

  const cle5 = draft.defects.find((d) => d.originalDefectName.startsWith('Cle-5'));
  const se9 = draft.defects.find((d) => d.originalDefectName.startsWith('Se-9'));
  assert.equal(cle5?.defectGroupId, 'dg-cle');
  assert.equal(cle5?.severity, 'Major');
  assert.equal(se9?.defectGroupId, 'dg-se');
  assert.equal(se9?.severity, 'Major');
});

