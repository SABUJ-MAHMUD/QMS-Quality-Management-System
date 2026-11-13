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

test('23 Master Defect Categories count and code prefixes', () => {
  assert.equal(MASTER_DEFECT_23_CATEGORIES.length, 23);
  const codes = MASTER_DEFECT_23_CATEGORIES.map((c) => c.code);
  assert.ok(codes.includes('Fa'));
  assert.ok(codes.includes('Po'));
  assert.ok(codes.includes('Ne'));
  assert.ok(codes.includes('Pl'));
  assert.ok(codes.includes('He'));
  assert.ok(codes.includes('Se'));
  assert.ok(codes.includes('Cle'));
  assert.ok(codes.includes('Pr'));
  assert.ok(codes.includes('Clo'));
  assert.ok(codes.includes('Sf'));
});

test('Defect classification for Ne-7, Pr-4, Cle-1, Fa-10', () => {
  const matchNe7 = classifyRawDefect('Ne-7 Collar points not uniform and balanced (other than specified).');
  assert.equal(matchNe7.defectGroupId, 'dg-ne');
  assert.equal(matchNe7.severity, 'Major');

  const matchPr4 = classifyRawDefect('Pr-4 Shine mark.');
  assert.equal(matchPr4.defectGroupId, 'dg-pr');
  assert.equal(matchPr4.severity, 'Major');

  const matchCle1 = classifyRawDefect('Cle-1 Spot, stain and soil marks.');
  assert.equal(matchCle1.defectGroupId, 'dg-cle');
  assert.equal(matchCle1.severity, 'Minor');

  const matchFa10 = classifyRawDefect('Fa-10 Foreign Yarns.');
  assert.equal(matchFa10.defectGroupId, 'dg-fa');
  assert.equal(matchFa10.severity, 'Minor');
});
