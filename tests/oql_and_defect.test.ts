import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReportOql } from '../src/utils/oqlCalculator.ts';
import { resolveBrandFromStyle } from '../src/utils/pdfParser.ts';
import { classifyRawDefect, MASTER_DEFECT_23_CATEGORIES } from '../src/data/defectMasterData.ts';

test('OQL calculation: (Defects ÷ Inspected) * 100', () => {
  const oql1 = calculateReportOql(3, 50);
  assert.equal(oql1, 6.0);

  const oql2 = calculateReportOql(5, 50);
  assert.equal(oql2, 10.0);

  const oql3 = calculateReportOql(0, 50);
  assert.equal(oql3, 0.0);
});

test('Brand resolution: 13 -> NAME IT, 15 -> ONLY, 22 -> ONLY&SONS', () => {
  assert.equal(resolveBrandFromStyle('13250961'), 'NAME IT');
  assert.equal(resolveBrandFromStyle('15381667'), 'ONLY');
  assert.equal(resolveBrandFromStyle('22041282'), 'ONLY&SONS');
  assert.equal(resolveBrandFromStyle('99999999', 'BESTSELLER'), 'BESTSELLER');
});

test('23 Master Defect Categories count, exact PDF order, and 194 sub-defects', () => {
  assert.equal(MASTER_DEFECT_23_CATEGORIES.length, 23);
  const expectedCounts: Array<[string, string, number]> = [
    ['Fa', 'Fabric Defects', 13],
    ['Sh', 'Shading Defects', 6],
    ['Cle', 'Cleanliness', 13],
    ['Em', 'Embroidery', 7],
    ['Pn', 'Printing', 6],
    ['Se', 'Seams and stitching', 25],
    ['Pr', 'Pressing', 5],
    ['La', 'Label, Hangtags, and other accessories', 12],
    ['Da', 'Darts', 1],
    ['Po', 'Pockets and flaps', 8],
    ['Ne', 'Neckline, Half-moon, Collar and Cuffs', 13],
    ['Pl', 'Plackets', 5],
    ['He', 'Hemming', 2],
    ['Clo', 'Closure', 27],
    ['Bu', 'Buckles, etc.', 3],
    ['Fo', 'Folding and packing', 6],
    ['De', 'Design and colour way', 1],
    ['Sc', 'Shipping Mark and Carton', 7],
    ['Pa', 'Padding', 4],
    ['WA', 'Washing Defects', 10],
    ['Le', 'Leather', 7],
    ['Ms', 'Measurement', 4],
    ['Sf', 'Safety', 9],
  ];

  assert.deepEqual(
    MASTER_DEFECT_23_CATEGORIES.map((c) => [c.code, c.name, c.subDefects.length]),
    expectedCounts
  );

  const totalSubDefects = MASTER_DEFECT_23_CATEGORIES.reduce((sum, c) => sum + c.subDefects.length, 0);
  assert.equal(totalSubDefects, 194);

  const cle = MASTER_DEFECT_23_CATEGORIES.find((c) => c.code === 'Cle')!;
  assert.equal(cle.subDefects[3].code, 'Cle-15');
  assert.equal(
    cle.subDefects[3].name,
    'Untrimmed thread / connecting threads/ floats at seams (>1 cm critical for kids wear)'
  );

  const sf = MASTER_DEFECT_23_CATEGORIES.find((c) => c.code === 'Sf')!;
  assert.equal(sf.subDefects[8].code, 'Sf-10');
  assert.equal(
    sf.subDefects[8].name,
    "Insecure trims attaching (Children's wear - critical & Adults wear – Major)"
  );
});

test('Defect classification for Ne-7, Pr-4, Cle-1, Fa-10, Se-10, La-9, Cle-15', () => {
  const matchNe7 = classifyRawDefect('Ne-7 Collar points not uniform and balanced (other than specified).');
  assert.equal(matchNe7.defectGroupId, 'dg-ne');
  assert.equal(matchNe7.standardDefectName, 'Collar points not uniform and balanced (other than specified)');
  assert.equal(matchNe7.severity, 'Major');

  const matchPr4 = classifyRawDefect('Pr-4 Shine mark.');
  assert.equal(matchPr4.defectGroupId, 'dg-pr');
  assert.equal(matchPr4.standardDefectName, 'Shine mark');
  assert.equal(matchPr4.severity, 'Major');

  const matchCle1 = classifyRawDefect('Cle-1 Spot, stain, and soil marks.');
  assert.equal(matchCle1.defectGroupId, 'dg-cle');
  assert.equal(matchCle1.standardDefectName, 'Spot, stain, and soil marks');
  assert.equal(matchCle1.severity, 'Minor');

  const matchFa10 = classifyRawDefect('Fa-10 Foreign Yarns.');
  assert.equal(matchFa10.defectGroupId, 'dg-fa');
  assert.equal(matchFa10.standardDefectName, 'Foreign Yarns');
  assert.equal(matchFa10.severity, 'Minor');

  const matchSe10 = classifyRawDefect('Se-10 Broken stitching.');
  assert.equal(matchSe10.defectGroupId, 'dg-se');
  assert.equal(matchSe10.standardDefectName, 'Broken stitching');
  assert.equal(matchSe10.severity, 'Major');

  const matchLa9 = classifyRawDefect('La-9 Main label incorrectly placed.');
  assert.equal(matchLa9.defectGroupId, 'dg-la');
  assert.equal(matchLa9.standardDefectName, 'Main label incorrectly placed');
  assert.equal(matchLa9.severity, 'Minor');

  const matchCle15 = classifyRawDefect('Cle-15 Untrimmed thread / connecting threads/ floats at seams');
  assert.equal(matchCle15.defectGroupId, 'dg-cle');
  assert.equal(matchCle15.severity, 'Critical');
});

