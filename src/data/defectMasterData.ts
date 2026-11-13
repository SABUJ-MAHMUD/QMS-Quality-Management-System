import { DefectGroup, DefectMasterItem, DefectSeverity } from '../types';

export interface DefectCategoryDefinition {
  code: string;
  name: string;
  description: string;
  color: string;
  subDefects: Array<{
    code: string;
    name: string;
    defaultSeverity: DefectSeverity;
  }>;
}

export const MASTER_DEFECT_23_CATEGORIES: DefectCategoryDefinition[] = [
  {
    code: 'Fa',
    name: 'Fabric Defects',
    description: 'Holes, drop stitch, barre, slub, foreign yarn, knitting/weaving defects',
    color: '#ea580c',
    subDefects: [
      { code: 'Fa-1', name: 'Hole / Needle cut / Yarn cut', defaultSeverity: 'Critical' },
      { code: 'Fa-2', name: 'Drop stitch / Laddering', defaultSeverity: 'Major' },
      { code: 'Fa-3', name: 'Slub / Thick and thin yarn', defaultSeverity: 'Minor' },
      { code: 'Fa-4', name: 'Knit barre / Streak', defaultSeverity: 'Major' },
      { code: 'Fa-5', name: 'Snagging / Pulled thread', defaultSeverity: 'Minor' },
      { code: 'Fa-6', name: 'Dead cotton / Neps', defaultSeverity: 'Minor' },
      { code: 'Fa-7', name: 'Fabric skewing / Torquing', defaultSeverity: 'Major' },
      { code: 'Fa-8', name: 'Bow / Skewness out of tolerance', defaultSeverity: 'Major' },
      { code: 'Fa-9', name: 'Missing yarn / Broken weave', defaultSeverity: 'Major' },
      { code: 'Fa-10', name: 'Foreign Yarns / Fly yarn', defaultSeverity: 'Minor' },
      { code: 'Fa-11', name: 'Lycra / Spandex drop out', defaultSeverity: 'Major' },
      { code: 'Fa-12', name: 'Crease mark / Fold line permanent', defaultSeverity: 'Minor' },
      { code: 'Fa-13', name: 'Abrasion / Fabric fuzzing', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Sh',
    name: 'Shading Defects',
    description: 'Shade variation within garment, panel to panel shading, center to selvedge',
    color: '#d97706',
    subDefects: [
      { code: 'Sh-1', name: 'Panel to panel shade difference', defaultSeverity: 'Major' },
      { code: 'Sh-2', name: 'Front to back shade difference', defaultSeverity: 'Major' },
      { code: 'Sh-3', name: 'Sleeve to body shade difference', defaultSeverity: 'Major' },
      { code: 'Sh-4', name: 'Collar/rib to body shade difference', defaultSeverity: 'Major' },
      { code: 'Sh-5', name: 'Uneven dye penetration / Wash shading', defaultSeverity: 'Major' },
      { code: 'Sh-6', name: 'Side to side shading within single panel', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Cle',
    name: 'Cleanliness',
    description: 'Spot, stain, oil mark, soil, untrimmed / uncut threads, dust marks',
    color: '#059669',
    subDefects: [
      { code: 'Cle-1', name: 'Spot, stain and soil marks', defaultSeverity: 'Minor' },
      { code: 'Cle-2', name: 'Machine oil mark / Lubricant stain', defaultSeverity: 'Major' },
      { code: 'Cle-3', name: 'Untrimmed thread ends reversed / Visible thread', defaultSeverity: 'Minor' },
      { code: 'Cle-4', name: 'Dust mark / Dirt handling smear', defaultSeverity: 'Minor' },
      { code: 'Cle-5', name: 'Oil spots or stains (cannot be removed)', defaultSeverity: 'Major' },
      { code: 'Cle-6', name: 'Glue or adhesive residue', defaultSeverity: 'Minor' },
      { code: 'Cle-7', name: 'Rust stain from needles / machinery', defaultSeverity: 'Major' },
      { code: 'Cle-8', name: 'Water mark / Iron water drop', defaultSeverity: 'Minor' },
      { code: 'Cle-9', name: 'Pen / Pencil / Tailor chalk marks', defaultSeverity: 'Minor' },
      { code: 'Cle-10', name: 'Loose thread loops inside/outside', defaultSeverity: 'Minor' },
      { code: 'Cle-11', name: 'Mildew / Mold scent or spot', defaultSeverity: 'Critical' },
      { code: 'Cle-12', name: 'Foreign fibers attached / Fluff', defaultSeverity: 'Minor' },
      { code: 'Cle-13', name: 'Discoloration due to chemical residue', defaultSeverity: 'Major' },
      { code: 'Cle-14', name: 'Packing paper / carton stain', defaultSeverity: 'Minor' },
      { code: 'Cle-15', name: 'General soiling / handling grubbiness', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Em',
    name: 'Embroidery',
    description: 'Embroidery tension, thread break, missing stitch, fuzz, misplacement',
    color: '#7c3aed',
    subDefects: [
      { code: 'Em-1', name: 'Embroidery missing stitches / gaps', defaultSeverity: 'Major' },
      { code: 'Em-2', name: 'Embroidery thread broken / loose loop', defaultSeverity: 'Major' },
      { code: 'Em-3', name: 'Embroidery puckering around motif', defaultSeverity: 'Minor' },
      { code: 'Em-4', name: 'Embroidery misplaced / off center', defaultSeverity: 'Major' },
      { code: 'Em-5', name: 'Embroidery backing paper visible / uncut', defaultSeverity: 'Minor' },
      { code: 'Em-6', name: 'Wrong thread colour or density', defaultSeverity: 'Major' },
      { code: 'Em-7', name: 'Distorted artwork / jagged letters', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Pn',
    name: 'Printing',
    description: 'Print cracking, peeling, smearing, misregistration, pinholes',
    color: '#2563eb',
    subDefects: [
      { code: 'Pn-1', name: 'Print cracking / Poor ink curing', defaultSeverity: 'Major' },
      { code: 'Pn-2', name: 'Print bleeding / Color smear', defaultSeverity: 'Major' },
      { code: 'Pn-3', name: 'Print misregistration / Color offset', defaultSeverity: 'Major' },
      { code: 'Pn-4', name: 'Print peeling / Flaking off', defaultSeverity: 'Major' },
      { code: 'Pn-5', name: 'Print pinholes / Incomplete ink fill', defaultSeverity: 'Minor' },
      { code: 'Pn-6', name: 'Print off-spec placement / Crooked', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Se',
    name: 'Seams and stitching',
    description: 'Broken stitching, open seam, skip stitch, seam puckering, uneven SPI',
    color: '#0891b2',
    subDefects: [
      { code: 'Se-1', name: 'Open seam / Hole in seam', defaultSeverity: 'Critical' },
      { code: 'Se-2', name: 'Broken stitching / Ruptured seam', defaultSeverity: 'Major' },
      { code: 'Se-3', name: 'Skip stitch / Dropped stitch', defaultSeverity: 'Major' },
      { code: 'Se-4', name: 'Seam puckering / Gathered seam', defaultSeverity: 'Minor' },
      { code: 'Se-5', name: 'Uneven stitching / Crooked topstitch', defaultSeverity: 'Minor' },
      { code: 'Se-6', name: 'Incorrect SPI (stitches per inch)', defaultSeverity: 'Minor' },
      { code: 'Se-7', name: 'Loose stitch / Tight thread tension', defaultSeverity: 'Minor' },
      { code: 'Se-8', name: 'Raw edge exposed / Unravelled seam', defaultSeverity: 'Major' },
      { code: 'Se-9', name: 'Needle chew / Over-penetration cut', defaultSeverity: 'Critical' },
      { code: 'Se-10', name: 'Run-off topstitching', defaultSeverity: 'Minor' },
      { code: 'Se-11', name: 'Wavy seam along edge', defaultSeverity: 'Minor' },
      { code: 'Se-12', name: 'Mismatched seam intersections (cross seams)', defaultSeverity: 'Major' },
      { code: 'Se-13', name: 'Overlap stitching too long or too short', defaultSeverity: 'Minor' },
      { code: 'Se-14', name: 'Missing bartack / Defective bartack', defaultSeverity: 'Major' },
      { code: 'Se-15', name: 'Incorrect thread type or color', defaultSeverity: 'Major' },
      { code: 'Se-16', name: 'Needle hole without thread', defaultSeverity: 'Minor' },
      { code: 'Se-17', name: 'Stitch tension unbalanced (birds nest)', defaultSeverity: 'Major' },
      { code: 'Se-18', name: 'Twisted seam / Seam torque', defaultSeverity: 'Major' },
      { code: 'Se-19', name: 'Uneven seam allowance width', defaultSeverity: 'Minor' },
      { code: 'Se-20', name: 'Chain stitch unravelling at end', defaultSeverity: 'Major' },
      { code: 'Se-21', name: 'Differential feed defect / Ruffling', defaultSeverity: 'Minor' },
      { code: 'Se-22', name: 'Seam grinning under light tension', defaultSeverity: 'Major' },
      { code: 'Se-23', name: 'Poor edge trimming on overlock', defaultSeverity: 'Minor' },
      { code: 'Se-24', name: 'Stitching width out of specification', defaultSeverity: 'Minor' },
      { code: 'Se-25', name: 'Reinforcement tape missing or twisted', defaultSeverity: 'Major' },
      { code: 'Se-26', name: 'Double stitching irregular gap', defaultSeverity: 'Minor' },
      { code: 'Se-27', name: 'Blind hem stitching visible on face', defaultSeverity: 'Minor' },
      { code: 'Se-28', name: 'Reverse stitching missing at seam ends', defaultSeverity: 'Major' },
      { code: 'Se-29', name: 'Seam crack under standard pull test', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Pr',
    name: 'Pressing',
    description: 'Shine mark, burn mark, poor crease, pressing impressions, watermark',
    color: '#ca8a04',
    subDefects: [
      { code: 'Pr-1', name: 'Poor iron press / Wrinkled garment', defaultSeverity: 'Minor' },
      { code: 'Pr-2', name: 'Iron scorch / Burn mark', defaultSeverity: 'Critical' },
      { code: 'Pr-3', name: 'Seam impression on garment face', defaultSeverity: 'Minor' },
      { code: 'Pr-4', name: 'Shine mark on fabric from iron/heat', defaultSeverity: 'Major' },
      { code: 'Pr-5', name: 'Steam water spot or watermark', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'La',
    name: 'Label, Hangtags, and other accessories',
    description: 'Care label, brand label, size label, hangtags, price stickers, placement',
    color: '#0d9488',
    subDefects: [
      { code: 'La-1', name: 'Missing main brand label', defaultSeverity: 'Major' },
      { code: 'La-2', name: 'Missing or wrong size label', defaultSeverity: 'Critical' },
      { code: 'La-3', name: 'Missing or wrong care label content', defaultSeverity: 'Critical' },
      { code: 'La-4', name: 'Label sewn crooked or inverted', defaultSeverity: 'Minor' },
      { code: 'La-5', name: 'Label placed in wrong position', defaultSeverity: 'Minor' },
      { code: 'La-6', name: 'Care label illegible / Faded printing', defaultSeverity: 'Major' },
      { code: 'La-7', name: 'Missing hangtag or incorrect barcode', defaultSeverity: 'Major' },
      { code: 'La-8', name: 'Hangtag attached through fabric instead of seam', defaultSeverity: 'Minor' },
      { code: 'La-9', name: 'Wrong price sticker / EAN barcode mismatch', defaultSeverity: 'Critical' },
      { code: 'La-10', name: 'Security tag missing or broken', defaultSeverity: 'Major' },
      { code: 'La-11', name: 'Label scratchy / Raw edge irritating', defaultSeverity: 'Minor' },
      { code: 'La-12', name: 'Extra / Duplicate label attached', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Da',
    name: 'Darts',
    description: 'Dart point, dart shape, puckering at dart tip',
    color: '#475569',
    subDefects: [
      { code: 'Da-1', name: 'Dart asymmetrical / Puckered at point', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Po',
    name: 'Pockets and flaps',
    description: 'Pocket location, shape, size, puckering, flap placement, balance',
    color: '#4f46e5',
    subDefects: [
      { code: 'Po-1', name: 'Not in specified location more than 7 mm displacement', defaultSeverity: 'Major' },
      { code: 'Po-2', name: 'Shaped poorly', defaultSeverity: 'Minor' },
      { code: 'Po-3', name: 'Sewn crooked', defaultSeverity: 'Major' },
      { code: 'Po-4', name: 'Not of specified size and shape', defaultSeverity: 'Major' },
      { code: 'Po-5', name: 'Not uniform', defaultSeverity: 'Minor' },
      { code: 'Po-6', name: 'Pucker at joints', defaultSeverity: 'Minor' },
      { code: 'Po-7', name: 'Flaps not properly placed more than 5 mm displacement', defaultSeverity: 'Major' },
      { code: 'Po-8', name: 'Asymmetrical left to right', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Ne',
    name: 'Neckline, Half-moon, Collar and Cuffs',
    description: 'Neck shape, collar points balance, stand shape, puckering, cuff symmetry',
    color: '#b91c1c',
    subDefects: [
      { code: 'Ne-1', name: 'Incorrect Neckline and half-moon shape', defaultSeverity: 'Major' },
      { code: 'Ne-2', name: 'Not uniform in shape left to right', defaultSeverity: 'Major' },
      { code: 'Ne-3', name: 'Incorrect Collar and stand shape', defaultSeverity: 'Major' },
      { code: 'Ne-5', name: 'Wrong fabric or colour (if specified other than main fabric)', defaultSeverity: 'Major' },
      { code: 'Ne-6', name: 'Puckers or pleats at collar attachment', defaultSeverity: 'Minor' },
      { code: 'Ne-7', name: 'Collar points not uniform and balanced (other than specified)', defaultSeverity: 'Major' },
      { code: 'Ne-8', name: 'Puckering on collar joining', defaultSeverity: 'Minor' },
      { code: 'Ne-9', name: 'Misaligned or crooked collar settings more than 2 mm', defaultSeverity: 'Major' },
      { code: 'Ne-10', name: 'Puckered or crooked top stitching', defaultSeverity: 'Minor' },
      { code: 'Ne-11', name: 'Incorrect Cuff Shape', defaultSeverity: 'Minor' },
      { code: 'Ne-13', name: 'Pleated or puckered cuffs at sleeve joints in woven cuff', defaultSeverity: 'Minor' },
      { code: 'Ne-15', name: 'Rib collar or -cuffs set too tight (not having enough stretch ability)', defaultSeverity: 'Major' },
      { code: 'Ne-16', name: 'Twisting of side seam above 2.5 cm', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Pl',
    name: 'Plackets',
    description: 'Placket alignment, length, covering, crooked stitch, pleats at ends',
    color: '#9333ea',
    subDefects: [
      { code: 'Pl-1', name: 'Wrong fabric or colour (if specified other than main fabric and colour)', defaultSeverity: 'Major' },
      { code: 'Pl-2', name: 'Top and bottom placket length not equal more than 7 mm difference', defaultSeverity: 'Major' },
      { code: 'Pl-3', name: 'Top placket not covering inner placket', defaultSeverity: 'Major' },
      { code: 'Pl-4', name: 'Unbalanced and crooked placket top stitch', defaultSeverity: 'Minor' },
      { code: 'Pl-5', name: 'Pleats at ends (half placket/henleys)', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'He',
    name: 'Hemming',
    description: 'Hem shape, raw edges outside, uneven hem width, roping',
    color: '#0284c7',
    subDefects: [
      { code: 'He-1', name: 'Wrong shape / Asymmetrical hem', defaultSeverity: 'Major' },
      { code: 'He-2', name: 'Raw edges outside (other than specified)', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Clo',
    name: 'Closure',
    description: 'Buttons, buttonholes, snaps, zippers, hooks, velcro, alignment',
    color: '#dc2626',
    subDefects: [
      { code: 'Clo-1', name: 'Button missing / Broken button', defaultSeverity: 'Major' },
      { code: 'Clo-2', name: 'Button loose / Poorly attached', defaultSeverity: 'Minor' },
      { code: 'Clo-3', name: 'Buttonhole uncut / Partially cut', defaultSeverity: 'Major' },
      { code: 'Clo-4', name: 'Button and buttonhole misaligned / Gapping', defaultSeverity: 'Major' },
      { code: 'Clo-5', name: 'Zipper wavy / Puckered attachment', defaultSeverity: 'Major' },
      { code: 'Clo-6', name: 'Zipper slider stuck or malfunction', defaultSeverity: 'Critical' },
      { code: 'Clo-7', name: 'Snap button loose or defective', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Bu',
    name: 'Buckles, etc.',
    description: 'Buckles, D-rings, metal eyelets, rivets, adjusters',
    color: '#71717a',
    subDefects: [
      { code: 'Bu-1', name: 'Buckle missing, broken, or defective', defaultSeverity: 'Major' },
      { code: 'Bu-2', name: 'Rivet or eyelet sharp edge / Burr', defaultSeverity: 'Critical' },
      { code: 'Bu-3', name: 'Corrosion or tarnish on metal fittings', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Fo',
    name: 'Folding and packing',
    description: 'Folding format, polybag size, tissue paper, hangtag position',
    color: '#16a34a',
    subDefects: [
      { code: 'Fo-1', name: 'Garment folded incorrectly against spec', defaultSeverity: 'Minor' },
      { code: 'Fo-2', name: 'Wrong size polybag used', defaultSeverity: 'Minor' },
      { code: 'Fo-3', name: 'Polybag suffocation warning missing', defaultSeverity: 'Critical' },
      { code: 'Fo-4', name: 'Silica gel packet missing / Broken', defaultSeverity: 'Major' },
      { code: 'Fo-5', name: 'Garment damp inside polybag', defaultSeverity: 'Critical' },
      { code: 'Fo-6', name: 'Polybag seal defective / Open', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'De',
    name: 'Design and colour way',
    description: 'Wrong design detail, contrast stitching missing, incorrect silhouette',
    color: '#c026d3',
    subDefects: [
      { code: 'De-1', name: 'Design detail off specification / Wrong color way', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Sc',
    name: 'Shipping Mark and Carton',
    description: 'Carton barcode, shipping marks, carton quality, quantity per box',
    color: '#854d0e',
    subDefects: [
      { code: 'SC-1', name: 'Carton shipping mark incorrect / Missing', defaultSeverity: 'Major' },
      { code: 'SC-2', name: 'Carton barcode unscannable', defaultSeverity: 'Major' },
      { code: 'SC-3', name: 'Damaged or crushed carton box', defaultSeverity: 'Major' },
      { code: 'SC-4', name: 'Wrong quantity packed inside carton', defaultSeverity: 'Critical' },
      { code: 'SC-5', name: 'Mixed sizes or colors in solid carton', defaultSeverity: 'Critical' },
      { code: 'SC-6', name: 'Carton sealing tape broken / Poor adhesive', defaultSeverity: 'Minor' },
      { code: 'SC-7', name: 'Gross / Net weight mismatch on carton', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Pa',
    name: 'Padding',
    description: 'Wadding, padding distribution, quilting lines, fill weight',
    color: '#0369a1',
    subDefects: [
      { code: 'Pa-1', name: 'Uneven padding / Lumping inside panel', defaultSeverity: 'Major' },
      { code: 'Pa-2', name: 'Padding migration through shell / Leakage', defaultSeverity: 'Major' },
      { code: 'Pa-3', name: 'Quilting line missed or irregular', defaultSeverity: 'Minor' },
      { code: 'Pa-4', name: 'Insufficient fill weight / Thin spots', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'WA',
    name: 'Washing Defects',
    description: 'Wash effect, handfeel, smell, color bleed, enzyme damage',
    color: '#0284c7',
    subDefects: [
      { code: 'Wa-1', name: 'Wash effect too light or too dark', defaultSeverity: 'Major' },
      { code: 'Wa-2', name: 'Uneven wash effect / Streaks', defaultSeverity: 'Major' },
      { code: 'Wa-3', name: 'Garment harsh handfeel / Not softened', defaultSeverity: 'Minor' },
      { code: 'Wa-4', name: 'Chemical / Foul odor remaining', defaultSeverity: 'Major' },
      { code: 'Wa-5', name: 'Abrasion / Hole caused by heavy washing', defaultSeverity: 'Critical' },
      { code: 'Wa-6', name: 'Color bleeding onto white parts', defaultSeverity: 'Major' },
      { code: 'Wa-7', name: 'Staining from pocket bag dye', defaultSeverity: 'Major' },
      { code: 'Wa-8', name: 'Excess shrinkage after wash', defaultSeverity: 'Major' },
      { code: 'Wa-9', name: 'Pilling formed during wash cycle', defaultSeverity: 'Minor' },
      { code: 'Wa-10', name: 'Towel or lint residue stuck to fabric', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Le',
    name: 'Leather',
    description: 'Leather scratches, grain variation, stiffness, loose stitches',
    color: '#78350f',
    subDefects: [
      { code: 'Le-1', name: 'Leather surface scratch / Scuff mark', defaultSeverity: 'Major' },
      { code: 'Le-2', name: 'Uneven leather grain / Color variation', defaultSeverity: 'Major' },
      { code: 'Le-3', name: 'Leather stiffness / Hardness variation', defaultSeverity: 'Minor' },
      { code: 'Le-4', name: 'Edge paint cracking / Peeling', defaultSeverity: 'Major' },
      { code: 'Le-5', name: 'Stitch holes enlarged / Torn needle cut', defaultSeverity: 'Critical' },
      { code: 'Le-6', name: 'Glue residue on leather face', defaultSeverity: 'Minor' },
      { code: 'Le-7', name: 'Leather thickness out of specification', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Ms',
    name: 'Measurement',
    description: 'Key points of measurement out of buyer tolerance table',
    color: '#0891b2',
    subDefects: [
      { code: 'Ms-1', name: 'Out of tolerance on critical point (Chest / Length / Waist)', defaultSeverity: 'Major' },
      { code: 'Ms-2', name: 'Out of tolerance on secondary point (Sleeve / Neck / Hem)', defaultSeverity: 'Minor' },
      { code: 'Ms-3', name: 'Asymmetrical measurement (Left vs Right sleeve/leg)', defaultSeverity: 'Major' },
      { code: 'Ms-4', name: 'Sizing graded incorrectly across full size run', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Sf',
    name: 'Safety',
    description: 'Needle fragments, sharp points, cord hazards, choking risks',
    color: '#b91c1c',
    subDefects: [
      { code: 'Sf-1', name: 'Broken needle fragment detected', defaultSeverity: 'Critical' },
      { code: 'Sf-2', name: 'Sharp pin, staple, or wire left in garment', defaultSeverity: 'Critical' },
      { code: 'Sf-3', name: 'Drawstring length exceeds safety standard (choking hazard)', defaultSeverity: 'Critical' },
      { code: 'Sf-4', name: 'Small parts detachment / Choking hazard (<90N pull test)', defaultSeverity: 'Critical' },
      { code: 'Sf-5', name: 'Sharp edge or burr on metal component', defaultSeverity: 'Critical' },
      { code: 'Sf-6', name: 'Lead or phthalate prohibited substance issue', defaultSeverity: 'Critical' },
      { code: 'Sf-7', name: 'Flammability test non-compliance', defaultSeverity: 'Critical' },
      { code: 'Sf-8', name: 'Unsecured toggle or cord stopper on infant garment', defaultSeverity: 'Critical' },
      { code: 'Sf-9', name: 'Suffocation risk on packaging bag (no holes/warning)', defaultSeverity: 'Critical' },
      { code: 'Sf-10', name: 'Hazardous odor or chemical residue', defaultSeverity: 'Critical' },
    ],
  },
];

// Convert the 23 categories into DefectGroup[] and DefectMasterItem[]
export const INITIAL_DEFECT_GROUPS: DefectGroup[] = MASTER_DEFECT_23_CATEGORIES.map((cat, idx) => ({
  id: `dg-${cat.code.toLowerCase()}`,
  groupName: `${cat.name} (${cat.code})`,
  description: cat.description,
  status: 'Active' as const,
  color: cat.color,
}));

export const INITIAL_DEFECT_MASTER: DefectMasterItem[] = MASTER_DEFECT_23_CATEGORIES.flatMap((cat) =>
  cat.subDefects.map((sub, sIdx) => ({
    id: `dm-${sub.code.toLowerCase()}`,
    standardDefectName: sub.name,
    defectGroupId: `dg-${cat.code.toLowerCase()}`,
    severity: sub.defaultSeverity,
    keywords: [sub.code.toLowerCase(), sub.name.toLowerCase()],
    buyer: 'BESTSELLER',
    approvedStatus: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  }))
);

/**
 * Intelligent Keyword & Defect Matching Engine
 * Matches raw descriptions (e.g. "Ne-7 Collar points not uniform", "Pr-4 Shine mark.", "Cle-1 Spot, stain...")
 */
export function classifyRawDefect(
  rawText: string,
  defectMaster: DefectMasterItem[] = INITIAL_DEFECT_MASTER,
  defectGroups: DefectGroup[] = INITIAL_DEFECT_GROUPS
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
      defectGroupId: 'dg-se',
      severity: 'Minor',
      matchType: 'Pending',
      confidence: 30,
    };
  }

  const clean = rawText.trim();
  const lower = clean.toLowerCase();

  // 1. Direct code prefix match (e.g. "Ne-7", "Pr-4", "Cle-1", "Fa-10", "Po-3", etc.)
  const codeMatch = clean.match(/^([A-Za-z]{2,3}-\d{1,2})\b/);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    const prefix = code.split('-')[0];
    const cat = MASTER_DEFECT_23_CATEGORIES.find((c) => c.code.toUpperCase() === prefix);
    if (cat) {
      const sub = cat.subDefects.find((s) => s.code.toUpperCase() === code);
      if (sub) {
        return {
          standardDefectName: sub.name,
          defectGroupId: `dg-${cat.code.toLowerCase()}`,
          severity: sub.defaultSeverity,
          matchType: 'Auto-Matched',
          confidence: 99,
        };
      }
      return {
        standardDefectName: clean.replace(/^[A-Za-z]{2,3}-\d{1,2}\s*/, ''),
        defectGroupId: `dg-${cat.code.toLowerCase()}`,
        severity: 'Major',
        matchType: 'Auto-Matched',
        confidence: 92,
      };
    }
  }

  // 2. Exact or substring match in MASTER_DEFECT_23_CATEGORIES
  for (const cat of MASTER_DEFECT_23_CATEGORIES) {
    for (const sub of cat.subDefects) {
      if (lower.includes(sub.code.toLowerCase()) || lower.includes(sub.name.toLowerCase())) {
        return {
          standardDefectName: sub.name,
          defectGroupId: `dg-${cat.code.toLowerCase()}`,
          severity: sub.defaultSeverity,
          matchType: 'Auto-Matched',
          confidence: 95,
        };
      }
    }
  }

  // 3. Fallback semantic checks
  if (lower.includes('collar') || lower.includes('neck') || lower.includes('cuff')) {
    return { standardDefectName: 'Collar points not uniform and balanced', defectGroupId: 'dg-ne', severity: 'Major', matchType: 'Auto-Matched', confidence: 90 };
  }
  if (lower.includes('shine') || lower.includes('press mark')) {
    return { standardDefectName: 'Shine mark on fabric from iron/heat', defectGroupId: 'dg-pr', severity: 'Major', matchType: 'Auto-Matched', confidence: 90 };
  }
  if (lower.includes('oil') || lower.includes('stain') || lower.includes('soil') || lower.includes('spot') || lower.includes('clean')) {
    return { standardDefectName: 'Spot, stain and soil marks', defectGroupId: 'dg-cle', severity: 'Minor', matchType: 'Auto-Matched', confidence: 90 };
  }
  if (lower.includes('yarn') || lower.includes('fiber') || lower.includes('hole')) {
    return { standardDefectName: 'Foreign Yarns / Fly yarn', defectGroupId: 'dg-fa', severity: 'Minor', matchType: 'Auto-Matched', confidence: 90 };
  }
  if (lower.includes('stitch') || lower.includes('seam') || lower.includes('pucker')) {
    return { standardDefectName: 'Skip stitch / Dropped stitch', defectGroupId: 'dg-se', severity: 'Major', matchType: 'Auto-Matched', confidence: 85 };
  }

  return {
    standardDefectName: clean,
    defectGroupId: 'dg-se',
    severity: 'Major',
    matchType: 'Pending',
    confidence: 60,
  };
}
