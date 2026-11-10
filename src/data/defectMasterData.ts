import { DefectGroup, DefectMasterItem, DefectSeverity } from '../types';

export const INITIAL_DEFECT_GROUPS: DefectGroup[] = [
  { id: 'dg-1', groupName: 'Seams & Stitching', description: 'Stitching irregularities, broken threads, skip stitch, puckering, open seams', status: 'Active', color: '#2563eb' },
  { id: 'dg-2', groupName: 'Cleanliness', description: 'Stains, spots, oil marks, dirt, untrimmed/uncut threads', status: 'Active', color: '#059669' },
  { id: 'dg-3', groupName: 'Neckline & Half Moon', description: 'Uneven neck shape, neck width out of spec, neck rib tension, half-moon/heart-moon patch', status: 'Active', color: '#d97706' },
  { id: 'dg-4', groupName: 'Collar & Cuffs', description: 'Collar point uneven, cuff width difference, distorted collar spread', status: 'Active', color: '#7c3aed' },
  { id: 'dg-5', groupName: 'Button & Buttonhole', description: 'Loose buttons, wrong placement, uncut buttonhole, broken button', status: 'Active', color: '#dc2626' },
  { id: 'dg-6', groupName: 'Measurement', description: 'Dimensions out of tolerance against buyer tech pack', status: 'Active', color: '#0891b2' },
  { id: 'dg-7', groupName: 'Garment Appearance', description: 'Twisted sleeve, asymmetrical hems, hi-lo hem, poor iron press, shade variation', status: 'Active', color: '#db2777' },
  { id: 'dg-8', groupName: 'Fabric Defects', description: 'Holes, needle cut, knit barre, slubs, fly yarn, color streaks', status: 'Active', color: '#ea580c' },
  { id: 'dg-9', groupName: 'Printing & Embroidery', description: 'Misprint, cracked print, color bleed, poor registration, embroidery fuzz', status: 'Active', color: '#4f46e5' },
  { id: 'dg-10', groupName: 'Accessories', description: 'Incorrect care label, missing hangtag, zipper defect, drawstring issue', status: 'Active', color: '#0d9488' },
  { id: 'dg-11', groupName: 'Product Safety', description: 'Broken needle fragment, sharp pin, choking hazard, cord length violation', status: 'Active', color: '#b91c1c' },
  { id: 'dg-12', groupName: 'Others', description: 'Packing error, polybag defect, barcode unscannable, miscellaneous', status: 'Active', color: '#64748b' },
];

export const INITIAL_DEFECT_MASTER: DefectMasterItem[] = [
  {
    id: 'dm-1',
    standardDefectName: 'Broken Stitching',
    defectGroupId: 'dg-1',
    severity: 'Major',
    keywords: ['broken stitch', 'broken stitching', 'stitch broken', 'ruptured seam', 'cut stitch'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-2',
    standardDefectName: 'Open Seam',
    defectGroupId: 'dg-1',
    severity: 'Critical',
    keywords: ['open seam', 'seam open', 'split seam', 'hole in seam', 'unstitched seam'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-3',
    standardDefectName: 'Seam Puckering',
    defectGroupId: 'dg-1',
    severity: 'Minor',
    keywords: ['pucker', 'puckering', 'seam gathering', 'wavy seam', 'tight tension'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-4',
    standardDefectName: 'Skip Stitch',
    defectGroupId: 'dg-1',
    severity: 'Major',
    keywords: ['skip stitch', 'skipped stitching', 'dropped stitch', 'missed stitch'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-5',
    standardDefectName: 'Oil Spot',
    defectGroupId: 'dg-2',
    severity: 'Major',
    keywords: ['oil spot', 'oil stain', 'machine oil', 'grease mark', 'lubricant'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-6',
    standardDefectName: 'Dirty Garment',
    defectGroupId: 'dg-2',
    severity: 'Minor',
    keywords: ['dirty garment', 'dirt mark', 'soil mark', 'dusty', 'stain', 'finger print'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-7',
    standardDefectName: 'Uncut Thread',
    defectGroupId: 'dg-2',
    severity: 'Minor',
    keywords: ['uncut thread', 'loose thread', 'long thread end', 'thread tail', 'untrimmed'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-8',
    standardDefectName: 'Uneven Neckline',
    defectGroupId: 'dg-3',
    severity: 'Major',
    keywords: ['uneven neck', 'uneven neckline', 'distorted neck', 'crooked neck', 'wavy collar'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-9',
    standardDefectName: 'Collar Point Uneven',
    defectGroupId: 'dg-4',
    severity: 'Major',
    keywords: ['collar point uneven', 'uneven collar', 'asymmetrical collar', 'crooked collar'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-10',
    standardDefectName: 'Buttonhole Placement Off',
    defectGroupId: 'dg-5',
    severity: 'Major',
    keywords: ['buttonhole placement', 'buttonhole off', 'misaligned button', 'crooked buttonhole'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-11',
    standardDefectName: 'Loose Button',
    defectGroupId: 'dg-5',
    severity: 'Minor',
    keywords: ['loose button', 'poor button attachment', 'loose stitch button'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-12',
    standardDefectName: 'Twisted Sleeve',
    defectGroupId: 'dg-7',
    severity: 'Major',
    keywords: ['twisted sleeve', 'torque sleeve', 'sleeve spirality', 'spiraling'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-13',
    standardDefectName: 'Needle Hole / Cut',
    defectGroupId: 'dg-8',
    severity: 'Critical',
    keywords: ['needle hole', 'fabric cut', 'fabric hole', 'needle cut', 'yarn rupture'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-14',
    standardDefectName: 'Color Shading / Tint Off',
    defectGroupId: 'dg-8',
    severity: 'Major',
    keywords: ['shade variation', 'color shading', 'color variation', 'panel shading'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-15',
    standardDefectName: 'Broken Needle Fragment',
    defectGroupId: 'dg-11',
    severity: 'Critical',
    keywords: ['broken needle', 'metal fragment', 'pin detected', 'needle tip', 'foreign metal'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-16',
    standardDefectName: 'Out of Tolerance Measurement',
    defectGroupId: 'dg-6',
    severity: 'Major',
    keywords: ['out of spec', 'measurement out', 'chest width deviation', 'body length short'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-17',
    standardDefectName: 'Print Smear / Crack',
    defectGroupId: 'dg-9',
    severity: 'Major',
    keywords: ['print smear', 'cracked print', 'print crack', 'rub off', 'ink smear'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'dm-18',
    standardDefectName: 'Other Defects',
    defectGroupId: 'dg-12',
    severity: 'Minor',
    keywords: ['other', 'miscellaneous', 'general defect'],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
];

/**
 * Intelligent Keyword & Defect Matching Engine
 * Takes raw description extracted from PDF and finds standard name, group, and severity.
 */
export function classifyRawDefect(
  rawText: string,
  defectMaster: DefectMasterItem[],
  defectGroups: DefectGroup[]
): {
  standardDefectName: string;
  defectGroupId: string;
  severity: DefectSeverity;
  matchType: 'Auto-Matched' | 'AI-Classified' | 'Pending';
  confidence: number;
} {
  if (!rawText) {
    return {
      standardDefectName: 'Unspecified Defect',
      defectGroupId: 'dg-12',
      severity: 'Minor',
      matchType: 'Pending',
      confidence: 30,
    };
  }

  const clean = rawText.trim().toLowerCase();

  // 1. Direct standard name match
  const exact = defectMaster.find((dm) => dm.standardDefectName.toLowerCase() === clean);
  if (exact) {
    return {
      standardDefectName: exact.standardDefectName,
      defectGroupId: exact.defectGroupId,
      severity: exact.severity,
      matchType: 'Auto-Matched',
      confidence: 98,
    };
  }

  // 2. Keyword match against master items
  for (const item of defectMaster) {
    for (const kw of item.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        return {
          standardDefectName: item.standardDefectName,
          defectGroupId: item.defectGroupId,
          severity: item.severity,
          matchType: 'Auto-Matched',
          confidence: 90,
        };
      }
    }
  }

  // 3. Fallback heuristic based on common apparel terms
  if (clean.includes('stitch') || clean.includes('seam') || clean.includes('thread') || clean.includes('needle')) {
    if (clean.includes('broken needle')) {
      return { standardDefectName: 'Broken Needle Fragment', defectGroupId: 'dg-11', severity: 'Critical', matchType: 'Auto-Matched', confidence: 85 };
    }
    if (clean.includes('open')) {
      return { standardDefectName: 'Open Seam', defectGroupId: 'dg-1', severity: 'Critical', matchType: 'Auto-Matched', confidence: 85 };
    }
    if (clean.includes('pucker')) {
      return { standardDefectName: 'Seam Puckering', defectGroupId: 'dg-1', severity: 'Minor', matchType: 'Auto-Matched', confidence: 85 };
    }
    return { standardDefectName: 'Broken Stitching', defectGroupId: 'dg-1', severity: 'Major', matchType: 'Auto-Matched', confidence: 80 };
  }

  if (clean.includes('oil') || clean.includes('stain') || clean.includes('spot') || clean.includes('dirt') || clean.includes('dust')) {
    if (clean.includes('oil')) {
      return { standardDefectName: 'Oil Spot', defectGroupId: 'dg-2', severity: 'Major', matchType: 'Auto-Matched', confidence: 85 };
    }
    return { standardDefectName: 'Dirty Garment', defectGroupId: 'dg-2', severity: 'Minor', matchType: 'Auto-Matched', confidence: 80 };
  }

  if (clean.includes('neck') || clean.includes('rib')) {
    return { standardDefectName: 'Uneven Neckline', defectGroupId: 'dg-3', severity: 'Major', matchType: 'Auto-Matched', confidence: 80 };
  }

  if (clean.includes('button')) {
    return { standardDefectName: 'Buttonhole Placement Off', defectGroupId: 'dg-5', severity: 'Major', matchType: 'Auto-Matched', confidence: 80 };
  }

  // Pending classification for user validation
  return {
    standardDefectName: rawText,
    defectGroupId: 'dg-12',
    severity: 'Pending Classification',
    matchType: 'Pending',
    confidence: 45,
  };
}
