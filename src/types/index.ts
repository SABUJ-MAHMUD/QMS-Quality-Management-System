export type UserRole = 'Admin' | 'QMS Manager' | 'QMS Executive' | 'Viewer';

export type DefectSeverity = 'Critical' | 'Major' | 'Minor' | 'Pending Classification';

export type InspectionResult = 'PASSED' | 'FAILED' | 'PENDING' | 'RE-INSPECTION';

export type ExtractionStatus = 'Pending' | 'Extracting' | 'Extracted' | 'Failed' | 'Manually Entered';

export type ValidationStatus = 'Draft' | 'Validated' | 'Approved' | 'Rejected';

export type CapaStatus = 'Open' | 'In Progress' | 'Pending Verification' | 'Effective' | 'Ineffective' | 'Closed';

export type EffectivenessStatus = 'Effective' | 'Ineffective' | 'Pending Verification' | 'Under Monitoring' | 'Not Applicable';

export interface DefectGroup {
  id: string;
  groupName: string;
  description: string;
  status: 'Active' | 'Inactive';
  color?: string;
}

export interface DefectMasterItem {
  id: string;
  standardDefectName: string;
  defectGroupId: string;
  severity: DefectSeverity;
  keywords: string[];
  buyer: string;
  approvedStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionDefect {
  id: string;
  inspectionReportId: string;
  originalDefectName: string;
  standardDefectName: string;
  defectGroupId: string;
  severity: DefectSeverity;
  defectQuantity: number;
  defectPercentage?: number;
  classificationStatus: 'Auto-Matched' | 'AI-Classified' | 'User-Verified' | 'Pending';
  remarks?: string;
  createdAt: string;
}

export interface InspectionReport {
  id: string;
  buyer: string;
  factory: string;
  reportNumber: string;
  inspectionDate: string; // YYYY-MM-DD
  orderNumber: string;
  poNumber?: string;
  inspector?: string;
  styleNumber: string;
  color: string;
  productDescription: string;
  orderQuantity: number;
  inspectedQuantity: number;
  criticalDefectQuantity: number;
  majorDefectQuantity: number;
  minorDefectQuantity: number;
  totalDefectQuantity: number;
  defectiveGarmentQuantity?: number;
  oql: number; // calculated %
  inspectionResult: InspectionResult;
  inspectionLevel: string; // e.g. "Level II Normal", "Tightened"
  pdfFileName?: string;
  pdfFileUrl?: string;
  extractionStatus: ExtractionStatus;
  validationStatus: ValidationStatus;
  extractionConfidence?: number; // 0 - 100
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
  defects: InspectionDefect[];
  auditLogs?: {
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

export interface FiveWhyAnalysis {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
}

export interface CAPARecord {
  id: string;
  capaId: string; // e.g. "CAPA-2026-001"
  inspectionReportId: string;
  reportNumber: string;
  orderNumber: string;
  styleNumber: string;
  buyer: string;
  inspectionDefectId?: string;
  defectName: string;
  defectGroup: string;
  defectGroupId?: string;
  defectSeverity: DefectSeverity;
  defectQuantity: number;
  rootCause: string;
  fiveWhyAnalysis: FiveWhyAnalysis;
  correction: string; // Immediate containment
  correctiveAction: string; // Fix root cause
  preventiveAction: string; // Prevent recurrence
  responsiblePerson: string;
  responsibleDepartment: string;
  targetCompletionDate: string; // YYYY-MM-DD
  monitoringFrequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Per Batch';
  monitoringMethod: string;
  effectivenessStatus: EffectivenessStatus;
  capaStatus: CapaStatus;
  evidenceUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface MonitoringRecord {
  id: string;
  capaId: string;
  capaCode: string;
  monitoringDate: string; // YYYY-MM-DD
  responsiblePerson: string;
  monitoringFrequency: string;
  previousDefectQuantity: number;
  currentDefectQuantity: number;
  reductionPercentage: number | null; // null if previous was 0
  effectivenessStatus: EffectivenessStatus;
  monitoringRemarks: string;
  evidenceUrl?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface GlobalFilterState {
  buyer: string;
  financialYear: string;
  month: string;
  dateFrom: string;
  dateTo: string;
  orderNumber: string;
  styleNumber: string;
  defectGroup: string;
  defectSeverity: string;
  inspectionResult: string;
  searchQuery: string;
}

export interface AppSettings {
  targetOql: number; // default 4.50
  financialYearStartMonth: number; // 8 for August
  factoryName: string;
  defaultBuyer: string;
  oqlDecimals: number;
}
