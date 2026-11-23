import { InspectionReport } from '../types';
import {
  DefectCategoryDefinition,
  MASTER_DEFECT_23_CATEGORIES,
  classifyRawDefect,
  resolveDefectAccurate,
} from '../data/defectMasterData';

export type MasterSubDefect = DefectCategoryDefinition['subDefects'][number];

export interface SubDefectStat extends MasterSubDefect {
  quantityAffected: number;
  inspectionsWithDefects: number;
}

export interface MasterCategoryStat extends DefectCategoryDefinition {
  totalQuantityAffected: number;
  totalInspectionsWithDefects: number;
  unmappedQty: number;
  subStats: SubDefectStat[];
}

/**
 * Compiles statistics for each of the 23 Master Defect Categories and their individual sub-defects.
 * Both the outer 23 categories and the individual sub-defects inside every category are automatically
 * sorted descending by defect quantity (with inspection count as tie-breaker, preserving catalog order on ties).
 */
export function computeMasterCategoryStats(reports: InspectionReport[]): MasterCategoryStat[] {
  const subQtyMap = new Map<string, number>();
  const subReportsMap = new Map<string, Set<string>>();
  const catDirectQtyMap = new Map<string, number>();
  const catDirectReportsMap = new Map<string, Set<string>>();

  reports.forEach((r) => {
    r.defects?.forEach((d) => {
      const qty = Number(d.defectQuantity) || 0;
      if (qty <= 0) return;

      const resolved = resolveDefectAccurate(d);
      const rawName = (d.originalDefectName || '').trim().toLowerCase();
      const stdName = resolved.standardDefectName.trim().toLowerCase();
      const gid = resolved.defectGroupId.trim().toLowerCase();

      const preferredCat = gid
        ? MASTER_DEFECT_23_CATEGORIES.find(
            (c) => `dg-${c.code.toLowerCase()}` === gid || c.name.toLowerCase() === gid
          )
        : undefined;

      const orderedCats = preferredCat
        ? resolved.explicitCode
          ? [preferredCat]
          : [preferredCat, ...MASTER_DEFECT_23_CATEGORIES.filter((c) => c !== preferredCat)]
        : MASTER_DEFECT_23_CATEGORIES;

      let matchedSubCode: string | null = null;
      let matchedCatCode: string | null = preferredCat?.code || null;

      // 0. Exact explicit PDF code match FIRST (e.g. Se-10, La-9, Cle-3, Cle-5, Po-2)
      if (resolved.explicitCode) {
        const explicitUpper = resolved.explicitCode.toUpperCase();
        for (const cat of orderedCats) {
          const exactCode = cat.subDefects.find((sub) => sub.code.toUpperCase() === explicitUpper);
          if (exactCode) {
            matchedSubCode = exactCode.code;
            matchedCatCode = cat.code;
            break;
          }
        }
      }

      // 1. Exact standardDefectName match
      if (!matchedSubCode && stdName) {
        for (const cat of orderedCats) {
          const exact = cat.subDefects.find((sub) => sub.name.toLowerCase() === stdName);
          if (exact) {
            matchedSubCode = exact.code;
            matchedCatCode = cat.code;
            break;
          }
        }
      }

      // 2. Sub-defect full name inclusion in originalDefectName or standardDefectName
      if (!matchedSubCode) {
        for (const cat of orderedCats) {
          const found = cat.subDefects.find((sub) => {
            const subName = sub.name.toLowerCase();
            return rawName.includes(subName) || (stdName && stdName.includes(subName));
          });
          if (found) {
            matchedSubCode = found.code;
            matchedCatCode = cat.code;
            break;
          }
        }
      }

      // 3. Classify using master classifier if no exact sub-defect name matched yet
      if (!matchedSubCode) {
        const classified = classifyRawDefect(d.originalDefectName || d.standardDefectName || '');
        const classStd = classified.standardDefectName.toLowerCase();
        for (const cat of orderedCats) {
          const found = cat.subDefects.find((s) => s.name.toLowerCase() === classStd);
          if (found) {
            matchedSubCode = found.code;
            matchedCatCode = cat.code;
            break;
          }
        }
        if (!matchedCatCode && classified.defectGroupId) {
          const fallbackCat = MASTER_DEFECT_23_CATEGORIES.find(
            (c) => `dg-${c.code.toLowerCase()}` === classified.defectGroupId.toLowerCase()
          );
          if (fallbackCat) matchedCatCode = fallbackCat.code;
        }
      }

      // 4. Exact code prefix match (e.g. Fa-10, Po-2) ONLY when nothing above matched
      if (!matchedSubCode) {
        for (const cat of orderedCats) {
          const found = cat.subDefects.find((sub) => {
            const codeBoundaryRegex = new RegExp(`(^|[^a-z0-9])${sub.code.toLowerCase()}([^0-9]|$)`, 'i');
            return codeBoundaryRegex.test(rawName);
          });
          if (found) {
            matchedSubCode = found.code;
            matchedCatCode = cat.code;
            break;
          }
        }
      }

      if (matchedSubCode) {
        subQtyMap.set(matchedSubCode, (subQtyMap.get(matchedSubCode) || 0) + qty);
        if (!subReportsMap.has(matchedSubCode)) {
          subReportsMap.set(matchedSubCode, new Set<string>());
        }
        subReportsMap.get(matchedSubCode)!.add(r.id);
      } else if (matchedCatCode) {
        catDirectQtyMap.set(matchedCatCode, (catDirectQtyMap.get(matchedCatCode) || 0) + qty);
        if (!catDirectReportsMap.has(matchedCatCode)) {
          catDirectReportsMap.set(matchedCatCode, new Set<string>());
        }
        catDirectReportsMap.get(matchedCatCode)!.add(r.id);
      }
    });
  });

  return MASTER_DEFECT_23_CATEGORIES.map((cat) => {
    let totalQty = catDirectQtyMap.get(cat.code) || 0;
    const inspectionCountSet = new Set<string>(catDirectReportsMap.get(cat.code) || []);

    const subStats = cat.subDefects
      .map((sub, originalIndex) => {
        const subQty = subQtyMap.get(sub.code) || 0;
        const subSet = subReportsMap.get(sub.code);
        totalQty += subQty;
        subSet?.forEach((id) => inspectionCountSet.add(id));

        return {
          ...sub,
          quantityAffected: subQty,
          inspectionsWithDefects: subSet ? subSet.size : 0,
          _originalIndex: originalIndex,
        };
      })
      .sort((a, b) => {
        if (b.quantityAffected !== a.quantityAffected) {
          return b.quantityAffected - a.quantityAffected;
        }
        if (b.inspectionsWithDefects !== a.inspectionsWithDefects) {
          return b.inspectionsWithDefects - a.inspectionsWithDefects;
        }
        return a._originalIndex - b._originalIndex;
      })
      .map(({ _originalIndex, ...sub }) => sub);

    return {
      ...cat,
      totalQuantityAffected: totalQty,
      totalInspectionsWithDefects: inspectionCountSet.size,
      unmappedQty: catDirectQtyMap.get(cat.code) || 0,
      subStats,
    };
  });
}

export function filterAndSortMasterCategoryStats(
  categoryStats: MasterCategoryStat[],
  options: { showOnlyActive: boolean; searchTerm: string }
): MasterCategoryStat[] {
  let list = categoryStats;
  if (options.showOnlyActive) {
    list = list.filter((c) => c.totalQuantityAffected > 0);
  }
  const q = options.searchTerm.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.subDefects.some((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    );
  }
  return [...list].sort((a, b) => {
    if (b.totalQuantityAffected !== a.totalQuantityAffected) {
      return b.totalQuantityAffected - a.totalQuantityAffected;
    }
    return b.totalInspectionsWithDefects - a.totalInspectionsWithDefects;
  });
}
