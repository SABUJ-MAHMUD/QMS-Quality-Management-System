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
    description: 'Fabric weight, drill holes, fabric faults, snags, pattern/print checks, creases, foreign yarns',
    color: '#ea580c',
    subDefects: [
      { code: 'Fa-1', name: 'Different weight / handle of fabric than approved sample', defaultSeverity: 'Major' },
      { code: 'Fa-2', name: 'Drill hole showing', defaultSeverity: 'Major' },
      { code: 'Fa-3', name: 'Fabric faults not evident on approved sample (e.g. Cuts, holes, spots, runs, missed picks, and ends)', defaultSeverity: 'Critical' },
      { code: 'Fa-4', name: 'Snags, pulled yarn, pilling, weaving/knit fault', defaultSeverity: 'Major' },
      { code: 'Fa-5', name: 'Pattern, print, stripes, checks do not match as specified', defaultSeverity: 'Major' },
      { code: 'Fa-6', name: 'Permanent creases on fabric', defaultSeverity: 'Major' },
      { code: 'Fa-7', name: 'Nap or pile deformation', defaultSeverity: 'Major' },
      { code: 'Fa-8', name: 'Undesirable odour', defaultSeverity: 'Major' },
      { code: 'Fa-9', name: 'Needle Drop', defaultSeverity: 'Major' },
      { code: 'Fa-10', name: 'Foreign Yarns', defaultSeverity: 'Minor' },
      { code: 'Fa-11', name: 'Wrong colour', defaultSeverity: 'Critical' },
      { code: 'Fa-12', name: 'Fabric hand feel significantly different from sealed sample', defaultSeverity: 'Major' },
      { code: 'Fa-13', name: 'Fabric weft yarn skewed / off-grain > 5%', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Sh',
    name: 'Shading Defects',
    description: 'Shade variations between panels, fabric/trim shade, dye streaks, batches, yellowing, wash intensity',
    color: '#d97706',
    subDefects: [
      { code: 'Sh-1', name: 'Shade variations between panels', defaultSeverity: 'Major' },
      { code: 'Sh-2', name: 'Shade variation of garment fabric and trim within the garment', defaultSeverity: 'Major' },
      { code: 'Sh-3', name: 'Dye streaks or marks at critical areas', defaultSeverity: 'Major' },
      { code: 'Sh-4', name: 'Different batches within the order comments', defaultSeverity: 'Major' },
      { code: 'Sh-5', name: 'Visible yellowing (indigo garments)', defaultSeverity: 'Major' },
      { code: 'Sh-6', name: 'Significant variation of wash effect intensity from sealed sample', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Cle',
    name: 'Cleanliness',
    description: 'Spot, stain, soil marks, untrimmed threads, contamination, oil spots, cuts/holes, loose threads, dust',
    color: '#059669',
    subDefects: [
      { code: 'Cle-1', name: 'Spot, stain, and soil marks', defaultSeverity: 'Minor' },
      { code: 'Cle-2', name: 'Untrimmed thread ends <1cm (m)/ Untrimmed thread ends >1cm (M)', defaultSeverity: 'Minor' },
      { code: 'Cle-3', name: 'Untrimmed thread ends reverse side < 2 cm (m)/Untrimmed thread ends reverse side >2 cm (M)', defaultSeverity: 'Minor' },
      { code: 'Cle-15', name: 'Untrimmed thread / connecting threads/ floats at seams (>1 cm critical for kids wear)', defaultSeverity: 'Critical' },
      { code: 'Cle-4', name: 'Contamination on garment', defaultSeverity: 'Major' },
      { code: 'Cle-5', name: 'Oil spots or stains (cannot be removed)', defaultSeverity: 'Major' },
      { code: 'Cle-6', name: 'Cuts and holes in fabric', defaultSeverity: 'Critical' },
      { code: 'Cle-8', name: 'Loose threads sticking to garment surface', defaultSeverity: 'Minor' },
      { code: 'Cle-9', name: 'Visible QC mark/paper/batch marking on surface', defaultSeverity: 'Minor' },
      { code: 'Cle-10', name: 'Visible chalk and other marks', defaultSeverity: 'Minor' },
      { code: 'Cle-12', name: 'Length mismatch (e.g. between shell and lining, front, and back panel)', defaultSeverity: 'Major' },
      { code: 'Cle-13', name: 'Dust on Garments', defaultSeverity: 'Minor' },
      { code: 'Cle-14', name: 'Poor sticking at Inside patch for breaks', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'Em',
    name: 'Embroidery',
    description: 'Artwork size/type, untrimmed threads, insecure tacking, placement, thread density, floats',
    color: '#7c3aed',
    subDefects: [
      { code: 'Em-1', name: 'Wrong size or type of Artwork', defaultSeverity: 'Major' },
      { code: 'Em-2', name: 'Untrimmed thread ends on surface <3mm (m)/ Untrimmed thread ends >3mm (M)', defaultSeverity: 'Minor' },
      { code: 'Em-6', name: 'Untrimmed thread ends on reverse <2 cm(m)/ Untrimmed thread ends >2cm (M)', defaultSeverity: 'Minor' },
      { code: 'Em-3', name: 'Insecurely tacked at ends (easily unravels)', defaultSeverity: 'Major' },
      { code: 'Em-4', name: 'Placement more than 7 mm displacement (than specified)', defaultSeverity: 'Major' },
      { code: 'Em-5', name: 'Incorrect thread density causing wavy and bumpy appearance', defaultSeverity: 'Major' },
      { code: 'Em-7', name: 'Connecting threads/ floats at reverse side of the embroidery (>7 mm critical for kids wear)', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Pn',
    name: 'Printing',
    description: 'Unwanted print spots, faded print, placement off, incorrect print size/misfit, bleeding, curing',
    color: '#2563eb',
    subDefects: [
      { code: 'Pn-1', name: 'Unwanted print spots', defaultSeverity: 'Minor' },
      { code: 'Pn-2', name: 'Faded print', defaultSeverity: 'Major' },
      { code: 'Pn-3', name: 'Print Placement off', defaultSeverity: 'Major' },
      { code: 'Pn-4', name: 'Incorrect print size/ misfit', defaultSeverity: 'Major' },
      { code: 'Pn-5', name: 'Print Bleeding', defaultSeverity: 'Major' },
      { code: 'Pn-6', name: 'Improper Print curing/ Sticky print', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Se',
    name: 'Seams and stitching',
    description: 'Open seam, skipped stitch, broken stitching, seam twisted/puckered, tacking, asymmetry',
    color: '#0891b2',
    subDefects: [
      { code: 'Se-1', name: 'Open seam', defaultSeverity: 'Critical' },
      { code: 'Se-2', name: 'Skipped stitch', defaultSeverity: 'Major' },
      { code: 'Se-3', name: 'Incomplete seams', defaultSeverity: 'Major' },
      { code: 'Se-4', name: 'Needle holes', defaultSeverity: 'Major' },
      { code: 'Se-5', name: 'Improper stitch tension that affects appearance', defaultSeverity: 'Major' },
      { code: 'Se-6', name: 'Raw edges outside (other than specified)', defaultSeverity: 'Major' },
      { code: 'Se-7', name: 'Untidy mending', defaultSeverity: 'Minor' },
      { code: 'Se-8', name: 'Monofilament yarn being used as sewing thread in any stitching incl. label stitching', defaultSeverity: 'Critical' },
      { code: 'Se-9', name: 'Seam twisted, puckered, or pleated (other than specified) affecting the appearance', defaultSeverity: 'Major' },
      { code: 'Se-10', name: 'Broken stitching', defaultSeverity: 'Major' },
      { code: 'Se-11', name: 'Uneven stitch density', defaultSeverity: 'Minor' },
      { code: 'Se-12', name: 'Uneven/run off stitching', defaultSeverity: 'Minor' },
      { code: 'Se-13', name: 'Untidy or improper tacking (e.g., unravels)', defaultSeverity: 'Major' },
      { code: 'Se-14', name: 'Too long tacking', defaultSeverity: 'Minor' },
      { code: 'Se-15', name: 'Missing bar tacks', defaultSeverity: 'Major' },
      { code: 'Se-16', name: 'Incorrect seam allowance', defaultSeverity: 'Major' },
      { code: 'Se-17', name: 'Untidy cutting of seam allowance reverse side', defaultSeverity: 'Minor' },
      { code: 'Se-20', name: 'Interline fusing delamination or bubble appearance', defaultSeverity: 'Major' },
      { code: 'Se-22', name: 'Stay / Faults stitch', defaultSeverity: 'Major' },
      { code: 'Se-23', name: 'Irregular / Gathering stitch', defaultSeverity: 'Minor' },
      { code: 'Se-24', name: 'Over stitch', defaultSeverity: 'Minor' },
      { code: 'Se-25', name: 'Asymmetrical length / width- Sleeve, neck, shoulder, leg, string, pocket, flap etc', defaultSeverity: 'Major' },
      { code: 'Se-26', name: 'Asymmetrical shape / height at Left & Right- Neck, Armhole, pocket, hem etc.', defaultSeverity: 'Major' },
      { code: 'Se-28', name: 'Length mismatch (e.g., between shell and lining, front and back panel)', defaultSeverity: 'Major' },
      { code: 'Se-29', name: 'Asymmetrical belt loop', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Pr',
    name: 'Pressing',
    description: 'Over pressing seam impression, stretched/distorted, wrinkles, shine mark, pressed poorly',
    color: '#ca8a04',
    subDefects: [
      { code: 'Pr-1', name: 'Over pressing causing seam impression', defaultSeverity: 'Minor' },
      { code: 'Pr-2', name: 'Stretched or distorted during pressing', defaultSeverity: 'Major' },
      { code: 'Pr-3', name: 'Wrinkles that require pressing', defaultSeverity: 'Minor' },
      { code: 'Pr-4', name: 'Shine mark', defaultSeverity: 'Major' },
      { code: 'Pr-5', name: 'Pressed poorly or not pressed at all', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'La',
    name: 'Label, Hangtags, and other accessories',
    description: 'Tags, hangtags, care & main labels, sewing thread colour, placement, faded/damaged accessories',
    color: '#0d9488',
    subDefects: [
      { code: 'La-1', name: 'Missing or wrong tags, hangtag, price tags etc.', defaultSeverity: 'Critical' },
      { code: 'La-2', name: 'Hangtags insecurely attached or misplaced', defaultSeverity: 'Minor' },
      { code: 'La-3', name: 'Missing labels, care, main label etc.', defaultSeverity: 'Critical' },
      { code: 'La-4', name: 'Wrong labels, care, main label etc.', defaultSeverity: 'Critical' },
      { code: 'La-5', name: 'Label sewing thread does not match colour of garment (other than specified)', defaultSeverity: 'Minor' },
      { code: 'La-6', name: 'Label sewing seam uneven, puckered and more than 5 mm away from label edge', defaultSeverity: 'Minor' },
      { code: 'La-7', name: 'Labels insecurely attached', defaultSeverity: 'Major' },
      { code: 'La-8', name: 'Care label missing all or some care symbols (min. the basic 5 pictograms)', defaultSeverity: 'Critical' },
      { code: 'La-9', name: 'Main label incorrectly placed', defaultSeverity: 'Minor' },
      { code: 'La-10', name: 'Care label incorrect placed <1cm displacement (m)/ >1cm displacement (M)', defaultSeverity: 'Minor' },
      { code: 'La-11', name: 'Faded Main labels, tags, wash care', defaultSeverity: 'Major' },
      { code: 'La-12', name: 'Damaged, Faded, unreadable accessories', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Da',
    name: 'Darts',
    description: 'Dart shape, length, and depth out of size description',
    color: '#475569',
    subDefects: [
      { code: 'Da-1', name: 'Incorrect in shape, length, and depth more than 5 mm out of size description', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Po',
    name: 'Pockets and flaps',
    description: 'Pocket location, shape, crooked sewing, size, uniformity, pucker at joints, flaps placement, symmetry',
    color: '#4f46e5',
    subDefects: [
      { code: 'Po-1', name: 'Not in specified location more than 7 mm displacement', defaultSeverity: 'Major' },
      { code: 'Po-2', name: 'Shaped poorly', defaultSeverity: 'Major' },
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
    description: 'Neckline, half-moon, collar & cuff shape, balance, alignment, puckering, rib tightness, twisting',
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
    description: 'Placket fabric/colour, length balance, inner placket coverage, top stitch, pleats at ends',
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
    description: 'Wrong shape and raw edges outside on hems',
    color: '#0284c7',
    subDefects: [
      { code: 'He-1', name: 'Wrong shape', defaultSeverity: 'Major' },
      { code: 'He-2', name: 'Raw edges outside (other than specified)', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Clo',
    name: 'Closure',
    description: 'Buttons, buttonholes, loops, snaps, fasteners, zippers, rivets, trims, drawstrings',
    color: '#dc2626',
    subDefects: [
      { code: 'Clo-1', name: 'Wrong buttons size, type, or colour', defaultSeverity: 'Major' },
      { code: 'Clo-2', name: 'Buttons missing or damaged', defaultSeverity: 'Major' },
      { code: 'Clo-3', name: 'Buttons placement off', defaultSeverity: 'Major' },
      { code: 'Clo-4', name: 'Buttons not sewn securely', defaultSeverity: 'Major' },
      { code: 'Clo-5', name: 'Buttonholes incorrect orientation than approved sample or specified (vertical, horizontal, or diagonal)', defaultSeverity: 'Major' },
      { code: 'Clo-6', name: 'Buttonholes placement off', defaultSeverity: 'Major' },
      { code: 'Clo-7', name: 'Buttonholes, button loops, omitted or added', defaultSeverity: 'Major' },
      { code: 'Clo-8', name: 'Buttonholes uncut (other than specified)', defaultSeverity: 'Major' },
      { code: 'Clo-9', name: 'Buttonholes, button loops incorrect in size (do not fit with the button)', defaultSeverity: 'Major' },
      { code: 'Clo-10', name: 'Buttonholes, button loops not sewn securely (easily unravels)', defaultSeverity: 'Major' },
      { code: 'Clo-11', name: 'Wrong thread colour (if specified other than tone in tone with main fabric)', defaultSeverity: 'Minor' },
      { code: 'Clo-12', name: 'Wrong type, size, or colour', defaultSeverity: 'Major' },
      { code: 'Clo-13', name: 'Defective snaps or fasteners that do not function', defaultSeverity: 'Major' },
      { code: 'Clo-14', name: 'Misalignments of fasteners causing bad appearance', defaultSeverity: 'Major' },
      { code: 'Clo-15', name: 'Snaps not attached properly or release very easily', defaultSeverity: 'Major' },
      { code: 'Clo-16', name: 'Improper zippers setting causing wavy and bumpy appearance', defaultSeverity: 'Major' },
      { code: 'Clo-17', name: 'Incorrect zipper size, type, or colour', defaultSeverity: 'Major' },
      { code: 'Clo-18', name: 'Defective zipper slides', defaultSeverity: 'Critical' },
      { code: 'Clo-19', name: 'Defective zipper stopper', defaultSeverity: 'Major' },
      { code: 'Clo-20', name: 'Tight clearance between slides and seam edge causing difficult slider operation', defaultSeverity: 'Major' },
      { code: 'Clo-21', name: 'Wrong rivet type, size, or colour', defaultSeverity: 'Major' },
      { code: 'Clo-22', name: 'Rivets incorrect placed more than 3 mm displacement', defaultSeverity: 'Major' },
      { code: 'Clo-23', name: 'Rivets with rough edges', defaultSeverity: 'Critical' },
      { code: 'Clo-24', name: 'Rivets not attached properly or release very easily', defaultSeverity: 'Major' },
      { code: 'Clo-25', name: 'Fabric pleats under rivets causing a bad appearance', defaultSeverity: 'Minor' },
      { code: 'Clo-26', name: 'Rusty or tarnish trims', defaultSeverity: 'Major' },
      { code: 'Clo-27', name: 'Raw or unfinished edge - draw strings, ties, and ribbon', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Bu',
    name: 'Buckles, etc.',
    description: 'Buckle size/colour, placement, and attachment safety for kids wear',
    color: '#71717a',
    subDefects: [
      { code: 'Bu-1', name: 'Wrong size or colour', defaultSeverity: 'Major' },
      { code: 'Bu-2', name: 'Incorrect placement', defaultSeverity: 'Major' },
      { code: 'Bu-3', name: 'Buckle insecurely attached for kids wear', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Fo',
    name: 'Folding and packing',
    description: 'Packing spec, assortment in box, mold contamination, shade variation in box, folding, polybag',
    color: '#16a34a',
    subDefects: [
      { code: 'Fo-1', name: 'Not as specified', defaultSeverity: 'Minor' },
      { code: 'Fo-2', name: 'Incorrect assortment in a box', defaultSeverity: 'Major' },
      { code: 'Fo-3', name: 'Mold contamination (spots or smell)', defaultSeverity: 'Critical' },
      { code: 'Fo-4', name: 'Shade variation within the box', defaultSeverity: 'Major' },
      { code: 'Fo-5', name: 'Folding not as specified', defaultSeverity: 'Minor' },
      { code: 'Fo-6', name: 'Damaged or incorrect polybag', defaultSeverity: 'Minor' },
    ],
  },
  {
    code: 'De',
    name: 'Design and colour way',
    description: 'Design and colour way not according to approved sample or specified',
    color: '#c026d3',
    subDefects: [
      { code: 'De-1', name: 'Not according to approved sample or specified', defaultSeverity: 'Critical' },
    ],
  },
  {
    code: 'Sc',
    name: 'Shipping Mark and Carton',
    description: 'Carton markings, over/understuffed, weight limit, dimensions, carton quality, wet/damaged cartons',
    color: '#854d0e',
    subDefects: [
      { code: 'SC-1', name: 'Damaged, wrong, or incomplete markings', defaultSeverity: 'Major' },
      { code: 'SC-2', name: 'Overstuffed carton', defaultSeverity: 'Minor' },
      { code: 'SC-3', name: 'Under stuffed carton', defaultSeverity: 'Minor' },
      { code: 'SC-4', name: 'Carton exceeding maximum weight limit', defaultSeverity: 'Major' },
      { code: 'SC-5', name: 'Incorrect carton Dimension', defaultSeverity: 'Major' },
      { code: 'SC-6', name: 'Incorrect Carton Quality', defaultSeverity: 'Major' },
      { code: 'SC-7', name: 'Wet or damaged cartons', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Pa',
    name: 'Padding',
    description: 'Padding volume, unevenness, visibility at seams, penetration of fibre/down',
    color: '#0369a1',
    subDefects: [
      { code: 'Pa-1', name: 'Incorrect voluminous of padding (compared to sealed sample)', defaultSeverity: 'Major' },
      { code: 'Pa-2', name: 'Unevenness of padding', defaultSeverity: 'Major' },
      { code: 'Pa-3', name: 'Visible padding at seams', defaultSeverity: 'Major' },
      { code: 'Pa-4', name: 'Penetration of fibre/down', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'WA',
    name: 'Washing Defects',
    description: 'Wash/dye mark, handfeel, uneven wash, cross stain, crease, PP spray, whisker, grinding, smell, moisture',
    color: '#0284c7',
    subDefects: [
      { code: 'Wa-1', name: 'Wash / Dye mark, spot', defaultSeverity: 'Major' },
      { code: 'Wa-2', name: 'Hand feels hard / Soft', defaultSeverity: 'Minor' },
      { code: 'Wa-3', name: 'Uneven Wash', defaultSeverity: 'Major' },
      { code: 'Wa-4', name: 'Cross stain, cleaning stain', defaultSeverity: 'Major' },
      { code: 'Wa-5', name: 'Line / Crease mark', defaultSeverity: 'Minor' },
      { code: 'Wa-6', name: 'Improper PP spray / Hand scraping  (compared to approved standard)', defaultSeverity: 'Major' },
      { code: 'Wa-7', name: 'Improper whisker / Chevron compared to approved standard', defaultSeverity: 'Major' },
      { code: 'Wa-8', name: 'Grinding / Destroy compared to approved standard', defaultSeverity: 'Major' },
      { code: 'Wa-9', name: 'Bad Smell', defaultSeverity: 'Major' },
      { code: 'Wa-10', name: 'Moisture', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Le',
    name: 'Leather',
    description: 'Leather gauge/thickness, wrinkles, shower/butcher cut, stiff leather, pin holes, panel variation, coating off',
    color: '#78350f',
    subDefects: [
      { code: 'Le-1', name: 'Gauge/Thickness uneven', defaultSeverity: 'Major' },
      { code: 'Le-2', name: 'Wrinkles', defaultSeverity: 'Minor' },
      { code: 'Le-3', name: 'Shower/butcher cut', defaultSeverity: 'Major' },
      { code: 'Le-4', name: 'Stiff leather', defaultSeverity: 'Major' },
      { code: 'Le-5', name: 'Pin holes.', defaultSeverity: 'Major' },
      { code: 'Le-6', name: 'Panel variation.', defaultSeverity: 'Major' },
      { code: 'Le-7', name: 'Coating off', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Ms',
    name: 'Measurement',
    description: 'Plus/minus out of tolerance measurement, oversize, and undersize measurement',
    color: '#0891b2',
    subDefects: [
      { code: 'Ms-1', name: 'Plus, out of tolerance measurement', defaultSeverity: 'Major' },
      { code: 'Ms-2', name: 'Minus out of tolerance measurement', defaultSeverity: 'Major' },
      { code: 'Ms-3', name: 'Oversize measurement', defaultSeverity: 'Major' },
      { code: 'Ms-4', name: 'Undersize measurement', defaultSeverity: 'Major' },
    ],
  },
  {
    code: 'Sf',
    name: 'Safety',
    description: 'Broken needle, neck strength, sharp edges, mold, draw length, insecure small parts/trims, insects, foreign objects',
    color: '#b91c1c',
    subDefects: [
      { code: 'Sf-1', name: 'Broken needle', defaultSeverity: 'Critical' },
      { code: 'Sf-2', name: 'Neck strength', defaultSeverity: 'Critical' },
      { code: 'Sf-3', name: 'Sharp edges', defaultSeverity: 'Critical' },
      { code: 'Sf-4', name: 'Mold', defaultSeverity: 'Critical' },
      { code: 'Sf-5', name: 'Draw length etc. exceed than specified for kids wear', defaultSeverity: 'Critical' },
      { code: 'Sf-6', name: 'Insecure small acc / decoration on baby products (under 3 years children)', defaultSeverity: 'Critical' },
      { code: 'Sf-7', name: 'Insect on product', defaultSeverity: 'Critical' },
      { code: 'Sf-9', name: 'Foreign substance/object in the box', defaultSeverity: 'Critical' },
      { code: 'Sf-10', name: "Insecure trims attaching (Children's wear - critical & Adults wear – Major)", defaultSeverity: 'Critical' },
    ],
  },
];

// Convert the 23 categories into DefectGroup[] and DefectMasterItem[]
export const INITIAL_DEFECT_GROUPS: DefectGroup[] = MASTER_DEFECT_23_CATEGORIES.map((cat) => ({
  id: `dg-${cat.code.toLowerCase()}`,
  groupName: `${cat.name} (${cat.code})`,
  description: cat.description,
  status: 'Active' as const,
  color: cat.color,
}));

export const INITIAL_DEFECT_MASTER: DefectMasterItem[] = MASTER_DEFECT_23_CATEGORIES.flatMap((cat) =>
  cat.subDefects.map((sub) => ({
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

export interface CanonicalDefectEntry {
  code: string;
  name: string;
  defaultSeverity: DefectSeverity;
  categoryCode: string;
  categoryName: string;
  defectGroupId: string;
  color: string;
}

export const CATEGORY_BY_CODE_MAP = new Map<string, DefectCategoryDefinition>();
export const SUB_DEFECT_BY_CODE_MAP = new Map<string, CanonicalDefectEntry>();
export const SUB_DEFECT_BY_NAME_MAP = new Map<string, CanonicalDefectEntry>();

for (const cat of MASTER_DEFECT_23_CATEGORIES) {
  CATEGORY_BY_CODE_MAP.set(cat.code.toUpperCase(), cat);
  const gid = `dg-${cat.code.toLowerCase()}`;
  for (const sub of cat.subDefects) {
    const entry: CanonicalDefectEntry = {
      code: sub.code,
      name: sub.name,
      defaultSeverity: sub.defaultSeverity,
      categoryCode: cat.code,
      categoryName: cat.name,
      defectGroupId: gid,
      color: cat.color,
    };
    SUB_DEFECT_BY_CODE_MAP.set(sub.code.toUpperCase(), entry);
    if (!SUB_DEFECT_BY_NAME_MAP.has(sub.name.toLowerCase())) {
      SUB_DEFECT_BY_NAME_MAP.set(sub.name.toLowerCase(), entry);
    }
  }
}

function findSubDefect(code: string) {
  const entry = SUB_DEFECT_BY_CODE_MAP.get(code.toUpperCase());
  if (!entry) return null;
  return {
    code: entry.code,
    standardDefectName: entry.name,
    defectGroupId: entry.defectGroupId,
    severity: entry.defaultSeverity,
  };
}

/**
 * Normalizes compact or alias PDF defect codes into canonical MASTER_DEFECT_23_CATEGORIES codes
 * e.g. CL5 -> CLE-5, CL1 -> CLE-1, SL1 / SL-1 -> CLE-1, FA10 -> FA-10, NE7 -> NE-7
 */
export function normalizeCompactDefectCode(rawCode: string): string | null {
  const cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, '');
  const m = cleaned.match(/^([A-Z]{2,3})-?(\d{1,2})$/);
  if (!m) return null;

  let prefix = m[1];
  const num = m[2];

  // Known aliases from PDF / OCR tables
  if (prefix === 'CL') prefix = 'CLE';
  if (prefix === 'SL') prefix = 'CLE';
  if (prefix === 'NO') prefix = 'NE';

  const cat = MASTER_DEFECT_23_CATEGORIES.find((c) => c.code.toUpperCase() === prefix);
  if (!cat) return null;

  return `${cat.code.toUpperCase()}-${num}`;
}

/**
 * Intelligent Keyword & Defect Matching Engine
 * Matches raw descriptions & official BESTSELLER codes (e.g. "Ne-7 Collar points...", "Cle-5 Oil spots...", "Se-10 Broken stitching", "CL5", "CL1", "NO1")
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

  // Check if leading prefix exists (e.g., Se-10, La-9, Po-2, Cle-5, CL5, NO1)
  const leadingCodeMatch = clean.match(/^([A-Za-z]{2,4}-?\d{1,3})\b/);
  const leadingRawCode = leadingCodeMatch ? leadingCodeMatch[1].toUpperCase() : '';
  const normalizedCode = leadingRawCode ? normalizeCompactDefectCode(leadingRawCode) : null;
  const codePrefix = normalizedCode ? normalizedCode.split('-')[0] : '';
  const prefixCategory = codePrefix
    ? MASTER_DEFECT_23_CATEGORIES.find((c) => c.code.toUpperCase() === codePrefix)
    : undefined;
  const descriptionPart = leadingCodeMatch
    ? clean.slice(leadingCodeMatch[0].length).replace(/^[:.\-\s]+/, '').toLowerCase()
    : lower;

  // 1. Exact canonical code match (since catalog now mirrors the exact official BESTSELLER PDF list)
  if (normalizedCode && prefixCategory) {
    const exactCodeSub = prefixCategory.subDefects.find((s) => s.code.toUpperCase() === normalizedCode);
    if (exactCodeSub) {
      return {
        standardDefectName: exactCodeSub.name,
        defectGroupId: `dg-${prefixCategory.code.toLowerCase()}`,
        severity: exactCodeSub.defaultSeverity,
        matchType: 'Auto-Matched',
        confidence: 98,
      };
    }
  }

  // 2. If descriptive text is present, match exact sub-defect name or semantic keyword
  if (descriptionPart.length >= 4) {
    const searchCats = prefixCategory
      ? [prefixCategory, ...MASTER_DEFECT_23_CATEGORIES.filter((c) => c !== prefixCategory)]
      : MASTER_DEFECT_23_CATEGORIES;

    for (const cat of searchCats) {
      for (const sub of cat.subDefects) {
        if (descriptionPart.includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(descriptionPart)) {
          return {
            standardDefectName: sub.name,
            defectGroupId: `dg-${cat.code.toLowerCase()}`,
            severity: sub.defaultSeverity,
            matchType: 'Auto-Matched',
            confidence: 97,
          };
        }
      }
    }

    // Semantic description matching mapped directly to exact PDF sub-defects
    if (lower.includes('oil spot') || lower.includes('oil stain') || (lower.includes('oil') && lower.includes('stain'))) {
      return { ...(findSubDefect('Cle-5')!), matchType: 'Auto-Matched', confidence: 95 };
    }
    if (lower.includes('untrimmed') || lower.includes('uncut thread') || lower.includes('loose thread')) {
      const code = lower.includes('surface') ? 'Cle-8' : 'Cle-3';
      return { ...(findSubDefect(code)!), matchType: 'Auto-Matched', confidence: 94 };
    }
    if (lower.includes('dirt') || lower.includes('stain') || lower.includes('soil') || lower.includes('spot') || lower.includes('chalk') || lower.includes('glue')) {
      return { ...(findSubDefect('Cle-1')!), matchType: 'Auto-Matched', confidence: 92 };
    }
    if (lower.includes('collar point')) {
      return { ...(findSubDefect('Ne-7')!), matchType: 'Auto-Matched', confidence: 94 };
    }
    if (lower.includes('neckline') || lower.includes('half-moon') || lower.includes('collar') || lower.includes('cuff')) {
      return { ...(findSubDefect('Ne-1')!), matchType: 'Auto-Matched', confidence: 92 };
    }
    if (lower.includes('shine') || lower.includes('press mark') || lower.includes('iron')) {
      return { ...(findSubDefect('Pr-4')!), matchType: 'Auto-Matched', confidence: 92 };
    }
    if (lower.includes('foreign yarn') || lower.includes('fly yarn')) {
      return { ...(findSubDefect('Fa-10')!), matchType: 'Auto-Matched', confidence: 92 };
    }
    // Use strict word boundary for "hole" so "armhole" or "buttonhole" never falsely trigger fabric hole
    if (/\bholes?\b/i.test(lower) || lower.includes('cuts and holes')) {
      const code = lower.includes('drill') ? 'Fa-2' : lower.includes('fabric') ? 'Fa-3' : 'Cle-6';
      return { ...(findSubDefect(code)!), matchType: 'Auto-Matched', confidence: 92 };
    }
    if (lower.includes('broken stitch')) {
      return { ...(findSubDefect('Se-10')!), matchType: 'Auto-Matched', confidence: 95 };
    }
    if (lower.includes('open seam')) {
      return { ...(findSubDefect('Se-1')!), matchType: 'Auto-Matched', confidence: 94 };
    }
    if (lower.includes('skip') && lower.includes('stitch')) {
      return { ...(findSubDefect('Se-2')!), matchType: 'Auto-Matched', confidence: 93 };
    }
    if (lower.includes('twisted seam') || lower.includes('seam twisted') || lower.includes('pucker')) {
      return { ...(findSubDefect('Se-9')!), matchType: 'Auto-Matched', confidence: 93 };
    }
    if (lower.includes('buttonhole')) {
      return { ...(findSubDefect('Clo-6')!), matchType: 'Auto-Matched', confidence: 92 };
    }
    if (lower.includes('seam') || lower.includes('stitch')) {
      return { ...(findSubDefect('Se-9')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('label') && (lower.includes('place') || lower.includes('position') || lower.includes('incorrect'))) {
      return { ...(findSubDefect('La-9')!), matchType: 'Auto-Matched', confidence: 93 };
    }
    if (lower.includes('label') || lower.includes('hangtag')) {
      return { ...(findSubDefect('La-3')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('shaped poorly') || (prefixCategory?.code === 'Po' && lower.includes('shape'))) {
      return { ...(findSubDefect('Po-2')!), matchType: 'Auto-Matched', confidence: 94 };
    }
    if (lower.includes('pocket') || lower.includes('flap')) {
      return { ...(findSubDefect('Po-3')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('shade') || lower.includes('shading')) {
      return { ...(findSubDefect('Sh-1')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('embroidery')) {
      return { ...(findSubDefect('Em-1')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('print')) {
      return { ...(findSubDefect('Pn-3')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('button') || lower.includes('zipper') || lower.includes('snap')) {
      return { ...(findSubDefect('Clo-2')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('placket')) {
      return { ...(findSubDefect('Pl-4')!), matchType: 'Auto-Matched', confidence: 88 };
    }
    if (lower.includes('hem')) {
      return { ...(findSubDefect('He-1')!), matchType: 'Auto-Matched', confidence: 88 };
    }

    for (const dm of defectMaster) {
      if (
        lower.includes(dm.standardDefectName.toLowerCase()) ||
        dm.keywords?.some((kw) => kw.length > 2 && lower.includes(kw.toLowerCase()))
      ) {
        return {
          standardDefectName: dm.standardDefectName,
          defectGroupId: dm.defectGroupId,
          severity: dm.severity,
          matchType: 'Auto-Matched',
          confidence: 90,
        };
      }
    }
  }

  // 3. Category prefix fallback when code number wasn't matched directly
  if (prefixCategory) {
    return {
      standardDefectName: prefixCategory.subDefects[0]?.name || clean.replace(/^[A-Za-z]{2,4}-?\d{1,3}\s*/, ''),
      defectGroupId: `dg-${prefixCategory.code.toLowerCase()}`,
      severity: prefixCategory.subDefects[0]?.defaultSeverity || 'Major',
      matchType: 'Auto-Matched',
      confidence: 88,
    };
  }

  // 4. Sub-code substring match fallback
  for (const cat of MASTER_DEFECT_23_CATEGORIES) {
    for (const sub of cat.subDefects) {
      if (lower.includes(sub.code.toLowerCase()) || lower.includes(sub.name.toLowerCase())) {
        return {
          standardDefectName: sub.name,
          defectGroupId: `dg-${cat.code.toLowerCase()}`,
          severity: sub.defaultSeverity,
          matchType: 'Auto-Matched',
          confidence: 92,
        };
      }
    }
  }

  // Check if matched any group by name
  const matchedGroup = defectGroups.find((g) => lower.includes(g.groupName.toLowerCase().split('(')[0].trim()));

  return {
    standardDefectName: clean,
    defectGroupId: matchedGroup?.id || 'dg-se',
    severity: 'Major',
    matchType: 'Pending',
    confidence: 60,
  };
}

/**
 * Resolves a stored defect record cleanly, repairing any legacy misclassifications
 * or legacy catalog labels so every code prefix maps accurately to its exact PDF category/sub-defect.
 */
export function resolveDefectAccurate(defect: {
  originalDefectName?: string;
  standardDefectName?: string;
  defectGroupId?: string;
}): {
  standardDefectName: string;
  defectGroupId: string;
  explicitCode: string | null;
} {
  const raw = (defect.originalDefectName || '').trim();
  const std = (defect.standardDefectName || '').trim();
  const gid = (defect.defectGroupId || '').trim();

  const leadingMatch = raw.match(/^([A-Za-z]{2,4}-?\d{1,3})\b/);
  const explicitCode = leadingMatch ? normalizeCompactDefectCode(leadingMatch[1]) : null;
  const prefix = explicitCode ? explicitCode.split('-')[0].toLowerCase() : '';
  const expectedGid = prefix ? `dg-${prefix}` : '';

  // Map explicit PDF code cleanly to canonical sub-defect name if present
  if (explicitCode) {
    const exactMatch = findSubDefect(explicitCode);
    if (exactMatch) {
      return {
        standardDefectName: exactMatch.standardDefectName,
        defectGroupId: exactMatch.defectGroupId,
        explicitCode,
      };
    }
  }

  if (expectedGid && gid && expectedGid !== gid.toLowerCase()) {
    const reclassified = classifyRawDefect(raw);
    return {
      standardDefectName: reclassified.standardDefectName,
      defectGroupId: reclassified.defectGroupId,
      explicitCode,
    };
  }

  return {
    standardDefectName: std || raw,
    defectGroupId: gid || expectedGid || 'dg-se',
    explicitCode,
  };
}

/**
 * Resolves any InspectionDefect record into a canonical single defect with official PDF code & category.
 */
export function getCanonicalDefectInfo(defect: {
  originalDefectName?: string;
  standardDefectName?: string;
  defectGroupId?: string;
}): {
  code: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  defectGroupId: string;
} {
  const resolved = resolveDefectAccurate(defect);

  if (resolved.explicitCode) {
    const byCode = SUB_DEFECT_BY_CODE_MAP.get(resolved.explicitCode.toUpperCase());
    if (byCode) {
      return {
        code: byCode.code,
        name: byCode.name,
        categoryCode: byCode.categoryCode,
        categoryName: byCode.categoryName,
        defectGroupId: byCode.defectGroupId,
      };
    }
  }

  const stdLower = resolved.standardDefectName.trim().toLowerCase();
  if (stdLower) {
    const byName = SUB_DEFECT_BY_NAME_MAP.get(stdLower);
    if (byName) {
      return {
        code: byName.code,
        name: byName.name,
        categoryCode: byName.categoryCode,
        categoryName: byName.categoryName,
        defectGroupId: byName.defectGroupId,
      };
    }
  }

  const classified = classifyRawDefect(defect.originalDefectName || defect.standardDefectName || '');
  const classEntry = SUB_DEFECT_BY_NAME_MAP.get(classified.standardDefectName.toLowerCase());
  if (classEntry) {
    return {
      code: classEntry.code,
      name: classEntry.name,
      categoryCode: classEntry.categoryCode,
      categoryName: classEntry.categoryName,
      defectGroupId: classEntry.defectGroupId,
    };
  }

  const catCode = (resolved.defectGroupId || '').replace(/^dg-/i, '').toUpperCase();
  const cat = CATEGORY_BY_CODE_MAP.get(catCode);
  return {
    code: resolved.explicitCode || cat?.code || 'Gen',
    name: resolved.standardDefectName || defect.originalDefectName || 'Unspecified Defect',
    categoryCode: cat?.code || 'Se',
    categoryName: cat?.name || 'Seams and stitching',
    defectGroupId: resolved.defectGroupId || 'dg-se',
  };
}
