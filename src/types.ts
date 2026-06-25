export type ViewName = "home" | "cohorts" | "dashboard" | "raw" | "raw_device" | "crf" | "mapping" | "query" | "export";

export type RawMode = "tables";

export type StatusKey =
  | "auto_filled"
  | "manual_required"
  | "review_required"
  | "missing"
  | "source_unclear"
  | "file_review_required";

export type InputModeKey = "auto" | "manual" | "manual_unextractable" | "review" | "unknown" | "file_review";

export type FieldControl = "select" | "boolean" | "number" | "date" | "text";

export interface CrfField {
  id: string;
  moduleId: string;
  module: string;
  label: string;
  options: string[];
  dataSource: string;
  rootSource: string;
  inputMode: InputModeKey;
  rawInputMode: string;
  annotationRequired: boolean;
  rawAnnotation: string;
  control: FieldControl;
  notes: string;
  sourceSystems: string[];
}

export interface CrfModule {
  id: string;
  name: string;
  fieldCount: number;
  sourceSystems: string[];
  fields: CrfField[];
}

export interface CrfTemplate {
  id: string;
  name: string;
  sourceFile: string;
  moduleCount: number;
  fieldCount: number;
  sourceSystemCounts: Record<string, number>;
  modules: CrfModule[];
  fields: CrfField[];
}

export interface CaseFieldValue {
  value: string;
  status: StatusKey;
  confirmedBy: string;
  updatedAt: string;
}

export interface CaseRecord {
  id: string;
  bed: string;
  demographics: string;
  diagnosis: string;
  owner: string;
  updatedAt: string;
  completion: number;
  statusCounts: Partial<Record<StatusKey, number>>;
  values: Record<string, CaseFieldValue>;
  cohortId?: string;
  patientLifecycleId?: string;
  enrollmentStatus?: "candidate" | "enrolled" | "excluded" | "withdrawn";
  withdrawalReason?: string;
  qualityStatus?: "complete" | "pending_review" | "data_missing";
}

export interface SourceEvidence {
  id: string;
  caseId: string;
  system: string;
  title: string;
  time: string;
  snippet: string;
  relatedFields: string[];
  fileType?: "PDF" | "XPS" | "图片" | "纸质扫描件";
  fileUrl?: string;
  previewTitle?: string;
  extractedFields?: DeviceExtractedField[];
  reviewStatus?: "已复核" | "待复核" | "缺失";
}

export interface DeviceExtractedField {
  label: string;
  value: string;
  unit?: string;
  fieldId?: string;
}

export interface DeviceReport {
  id: string;
  caseId: string;
  deviceName: string;
  system: string;
  fileName: string;
  fileType: "PDF" | "XPS" | "图片" | "纸质扫描件";
  reportTime: string;
  status: "uploaded" | "missing" | "review_required";
  previewTitle: string;
  conclusion: string;
  extractedFields: DeviceExtractedField[];
  relatedFields: string[];
}

export interface BedsideObservation {
  id: string;
  caseId: string;
  label: string;
  value: string;
  unit: string;
  observedAt: string;
  observer: string;
  source: string;
  status: StatusKey;
}

export interface TrendPoint {
  time: string;
  heartRate: number;
  map: number;
  temperature: number;
}

export interface DeviceEventPoint {
  time: string;
  label: string;
  value: string;
  system: string;
}

export interface CaseTrend {
  caseId: string;
  points: TrendPoint[];
  events: DeviceEventPoint[];
}

export interface DeviceMappingField {
  id: string;
  module: string;
  label: string;
  options: string[];
  sourceSystems: string[];
  dataSource: string;
  rootSource: string;
  inputMode: InputModeKey;
  notes: string;
  annotationRequired: boolean;
}

export type RawTableId =
  | "patient_profile"
  | "diagnosis_orders"
  | "lis_results"
  | "nursing_vitals"
  | "exam_reports"
  | "score_forms"
  | "followup";

export type RawTableRow = Record<string, string>;

export interface RawTable {
  id: RawTableId;
  caseId: string;
  name: string;
  system: string;
  columns: string[];
  rows: RawTableRow[];
  linkedFields: string[];
}

export type StatusLabels = Record<StatusKey, string>;

export type InputModeLabels = Record<InputModeKey, string>;

export type CohortStatus = "draft" | "screening" | "active" | "closed";

export type CandidateStatus = "pending" | "enrolled" | "excluded" | "deferred" | "needs_data";

export interface RuleCondition {
  id: string;
  sourceSystem: string;
  field: string;
  operator: "contains" | "exists" | ">=" | "<=" | ">" | "<" | "=" | "between";
  value: string;
  unit?: string;
  timeWindow?: string;
  summary: string;
}

export interface RuleGroup {
  id: string;
  logic: "AND" | "OR";
  summary: string;
  conditions: Array<RuleCondition | RuleGroup>;
}

export interface CohortProject {
  id: string;
  name: string;
  disease: string;
  owner: string;
  members: string[];
  status: CohortStatus;
  crfTemplateId: string;
  rules: RuleGroup;
  candidateCount: number;
  enrolledCount: number;
  withdrawnCount: number;
  completion: number;
  pendingReviewCount: number;
  manualRequiredCount: number;
  deviceMissingCount: number;
  followupMissingCount: number;
  mainCauseDistribution: Array<{ label: string; value: number }>;
  updatedAt: string;
}

export interface ScreeningCandidate {
  id: string;
  patientId: string;
  cohortId: string;
  caseId?: string;
  demographics: string;
  diagnosis: string;
  matchedRules: string[];
  evidence: string[];
  status: CandidateStatus;
  owner: string;
  scannedAt: string;
  handledAt?: string;
  note?: string;
}

export interface LifecycleEvent {
  id: string;
  stage: "门诊" | "住院" | "牙周科" | "出院" | "随访";
  time: string;
  title: string;
  description: string;
  sourceSystem: string;
  linkedFields?: string[];
}

export interface PatientLifecycle {
  id: string;
  caseId: string;
  cohortId: string;
  events: LifecycleEvent[];
}

export interface QueryTemplate {
  id: string;
  cohortId: string;
  name: string;
  description: string;
  conditions: string[];
  resultCaseIds: string[];
  chartType: "km" | "trend" | "distribution";
  exportPreset: string;
}

export interface ExportJob {
  id: string;
  cohortId: string;
  name: string;
  queryTemplateId?: string;
  includes: string[];
  fileTypes: string[];
  status: "ready" | "running" | "finished";
  createdBy: string;
  createdAt: string;
}
