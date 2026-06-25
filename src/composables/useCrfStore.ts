import { computed, reactive } from "vue";

import {
  bedsideObservations,
  caseRecords,
  caseTrends,
  cohortProjects,
  cohortQueryTemplates,
  crfTemplate,
  deviceMappingFields,
  deviceReports,
  exportJobs as exportJobSeed,
  inputModeLabels,
  patientLifecycles,
  rawTables,
  screeningCandidates,
  sourceEvidence,
  statusLabels,
  perioBedsideObservations,
  perioCaseRecords,
  perioCrfTemplate,
  perioDeviceMappingFields,
  perioDeviceReports,
  perioRawTables,
  perioSourceEvidence,
  perioTrends,
} from "@/data";
import type {
  CandidateStatus,
  CaseRecord,
  CohortProject,
  CrfField,
  CrfTemplate,
  RawMode,
  RawTableId,
  ScreeningCandidate,
  SourceEvidence,
  StatusKey,
  ViewName,
} from "@/types";

interface AppState {
  view: ViewName;
  cohortId: string;
  caseId: string;
  moduleId: string;
  fieldId: string;
  rawMode: RawMode;
  rawTableId: RawTableId;
  statusFilter: StatusKey | "all";
  fieldSearch: string;
  mappingSource: string;
  mappingModule: string;
  mappingInput: string;
  mappingSearch: string;
  deviceFilter: string;
  deviceKeyword: string;
  candidateFilter: CandidateStatus | "all";
  queryTemplateId: string;
  scanNotice: string;
}

const templates: Record<string, CrfTemplate> = {
  [crfTemplate.id]: crfTemplate,
  [perioCrfTemplate.id]: perioCrfTemplate,
};

const mainCases = structuredClone(caseRecords).map((caseRecord, index) => ({
  ...caseRecord,
  cohortId: "cohort-perio",
  patientLifecycleId: `life-${caseRecord.id}`,
  enrollmentStatus: "enrolled",
  qualityStatus: index === 2 ? "data_missing" : "pending_review",
})) satisfies CaseRecord[];

const cases = reactive<CaseRecord[]>([...mainCases, ...structuredClone(perioCaseRecords)]);
const cohorts = reactive<CohortProject[]>(structuredClone(cohortProjects));
const candidates = reactive<ScreeningCandidate[]>(structuredClone(screeningCandidates));
const queryTemplates = reactive(structuredClone(cohortQueryTemplates));
const exportJobs = reactive(structuredClone(exportJobSeed));

const allDeviceReports = reactive([...structuredClone(deviceReports), ...structuredClone(perioDeviceReports)]);
const allBedsideObservations = reactive([...structuredClone(bedsideObservations), ...structuredClone(perioBedsideObservations)]);
const allCaseTrends = reactive([...structuredClone(caseTrends), ...structuredClone(perioTrends)]);
const allSourceEvidence = reactive([...structuredClone(sourceEvidence), ...structuredClone(perioSourceEvidence)]);
const allRawTables = reactive([...structuredClone(rawTables), ...structuredClone(perioRawTables)]);
const allPatientLifecycles = reactive(structuredClone(patientLifecycles));
const allDeviceMappingFields = reactive([...structuredClone(deviceMappingFields), ...structuredClone(perioDeviceMappingFields)]);

const state = reactive<AppState>({
  view: "home",
  cohortId: "cohort-perio",
  caseId: mainCases[0].id,
  moduleId: crfTemplate.modules[0].id,
  fieldId: crfTemplate.modules[0].fields[0].id,
  rawMode: "tables",
  rawTableId: "patient_profile",
  statusFilter: "all",
  fieldSearch: "",
  mappingSource: "all",
  mappingModule: "all",
  mappingInput: "all",
  mappingSearch: "",
  deviceFilter: "all",
  deviceKeyword: "",
  candidateFilter: "all",
  queryTemplateId: "query-perio-bone-loss",
  scanNotice: "",
});

function countCaseStatus(caseRecord: CaseRecord) {
  const counts: Partial<Record<StatusKey, number>> = {
    auto_filled: 0,
    manual_required: 0,
    review_required: 0,
    missing: 0,
    source_unclear: 0,
    file_review_required: 0,
  };
  Object.values(caseRecord.values).forEach((item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
  });
  return counts;
}

function templateForCohort(cohort: CohortProject | undefined) {
  return templates[cohort?.crfTemplateId || crfTemplate.id] || crfTemplate;
}

const currentCohort = computed(() => cohorts.find((cohort) => cohort.id === state.cohortId) || cohorts[0]);

const currentTemplate = computed(() => templateForCohort(currentCohort.value));

function fieldById(fieldId: string): CrfField | undefined {
  return currentTemplate.value.fields.find((field) => field.id === fieldId);
}

const currentCases = computed(() => cases.filter((caseRecord) => caseRecord.cohortId === state.cohortId));

const currentCandidates = computed(() =>
  candidates.filter(
    (candidate) =>
      candidate.cohortId === state.cohortId && (state.candidateFilter === "all" || candidate.status === state.candidateFilter),
  ),
);

const currentQueryTemplates = computed(() => queryTemplates.filter((template) => template.cohortId === state.cohortId));

const currentQueryTemplate = computed(
  () => currentQueryTemplates.value.find((template) => template.id === state.queryTemplateId) || currentQueryTemplates.value[0],
);

const queryResults = computed(() => {
  const resultIds = currentQueryTemplate.value?.resultCaseIds || [];
  return currentCases.value.filter((caseRecord) => resultIds.includes(caseRecord.id));
});

const currentExportJobs = computed(() => exportJobs.filter((job) => job.cohortId === state.cohortId));

function ensureSelection() {
  const template = currentTemplate.value;
  const firstModule = template.modules[0];
  const firstCase = currentCases.value[0] || cases[0];
  if (!currentCases.value.some((caseRecord) => caseRecord.id === state.caseId)) {
    state.caseId = firstCase.id;
  }
  if (!template.modules.some((module) => module.id === state.moduleId)) {
    state.moduleId = firstModule.id;
  }
  if (!fieldById(state.fieldId)) {
    state.fieldId = firstModule.fields[0].id;
  }
  if (!currentQueryTemplates.value.some((template) => template.id === state.queryTemplateId) && currentQueryTemplates.value[0]) {
    state.queryTemplateId = currentQueryTemplates.value[0].id;
  }
}

function setView(view: ViewName) {
  state.view = view;
  ensureSelection();
}

function selectCohort(cohortId: string, view: ViewName = state.view) {
  const nextCohort = cohorts.find((cohort) => cohort.id === cohortId);
  if (!nextCohort) return;
  state.cohortId = nextCohort.id;
  state.view = view;
  const template = templateForCohort(nextCohort);
  state.moduleId = template.modules[0].id;
  state.fieldId = template.modules[0].fields[0].id;
  state.caseId = cases.find((caseRecord) => caseRecord.cohortId === cohortId)?.id || state.caseId;
  state.rawTableId = "patient_profile";
  state.rawMode = "tables";
  state.queryTemplateId = queryTemplates.find((template) => template.cohortId === cohortId)?.id || state.queryTemplateId;
  state.mappingModule = "all";
  state.mappingSource = "all";
  state.mappingInput = "all";
  state.fieldSearch = "";
  state.deviceKeyword = "";
}

function selectCase(caseId: string, view: ViewName = state.view) {
  const nextCase = cases.find((caseRecord) => caseRecord.id === caseId);
  if (!nextCase) return;
  if (nextCase.cohortId && nextCase.cohortId !== state.cohortId) {
    selectCohort(nextCase.cohortId, view);
  }
  state.caseId = nextCase.id;
  state.view = view;
  ensureSelection();
}

function selectModule(moduleId: string) {
  const module = currentTemplate.value.modules.find((item) => item.id === moduleId);
  if (!module) return;
  state.moduleId = module.id;
  state.fieldId = module.fields[0].id;
}

function selectField(fieldId: string, view: ViewName = state.view) {
  const field = fieldById(fieldId);
  if (!field) return;
  state.fieldId = field.id;
  state.moduleId = field.moduleId;
  state.view = view;
}

function updateCompletion(caseRecord: CaseRecord) {
  const counts = countCaseStatus(caseRecord);
  caseRecord.statusCounts = counts;
  const template = templates[currentCohort.value.crfTemplateId] || currentTemplate.value;
  const finished = (counts.auto_filled || 0) + (counts.review_required || 0);
  caseRecord.completion = Math.round((finished / template.fieldCount) * 100);
}

function updateFieldValue(fieldId: string, value: string) {
  const caseRecord = currentCase.value;
  const item = caseRecord.values[fieldId];
  if (!item) return;
  item.value = value;
  item.status = value ? "review_required" : "missing";
  item.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  state.fieldId = fieldId;
  updateCompletion(caseRecord);
}

function confirmField(fieldId: string) {
  const caseRecord = currentCase.value;
  const item = caseRecord.values[fieldId];
  if (!item) return;
  item.status = "auto_filled";
  item.confirmedBy = caseRecord.owner;
  item.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  state.fieldId = fieldId;
  updateCompletion(caseRecord);
}

function updateCandidateStatus(candidateId: string, status: CandidateStatus) {
  const candidate = candidates.find((item) => item.id === candidateId);
  if (!candidate) return;
  candidate.status = status;
  candidate.handledAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  if (status === "enrolled" && candidate.caseId) {
    selectCase(candidate.caseId, "crf");
  }
}

function runMockScan() {
  const pending = candidates.filter((candidate) => candidate.cohortId === state.cohortId && candidate.status === "pending").length;
  state.scanNotice = `${currentCohort.value.name} 本次 Mock 日扫命中 ${currentCohort.value.candidateCount} 人，其中 ${pending} 人待确认。`;
}

function selectRawTable(rawTableId: RawTableId) {
  state.rawTableId = rawTableId;
}

function selectQueryTemplate(queryTemplateId: string) {
  state.queryTemplateId = queryTemplateId;
}

const currentCase = computed(() => currentCases.value.find((caseRecord) => caseRecord.id === state.caseId) || currentCases.value[0] || cases[0]);

const currentModule = computed(
  () => currentTemplate.value.modules.find((module) => module.id === state.moduleId) || currentTemplate.value.modules[0],
);

const currentField = computed(() => fieldById(state.fieldId) || currentTemplate.value.fields[0]);

const currentValue = computed(() => currentCase.value.values[currentField.value.id]);

const currentDeviceReports = computed(() => allDeviceReports.filter((report) => report.caseId === state.caseId));

const sourceSystems = computed(() =>
  [
    ...new Set([
      ...currentTemplate.value.fields.flatMap((field) => field.sourceSystems),
      ...currentDeviceReports.value.map((report) => report.system),
      ...allDeviceMappingFields.map((field) => field.sourceSystems).flat(),
    ]),
  ].sort(),
);

const evidenceWithDevices = computed<SourceEvidence[]>(() => [
  ...allSourceEvidence,
  ...allDeviceReports
    .filter((report) => report.status !== "missing")
    .map((report) => ({
      id: report.id,
      caseId: report.caseId,
      system: report.system,
      title: report.deviceName,
      time: report.reportTime,
      snippet: report.conclusion,
      relatedFields: report.relatedFields,
      fileType: report.fileType,
      fileUrl: report.fileName,
      previewTitle: report.previewTitle,
      extractedFields: report.extractedFields,
      reviewStatus: report.status === "review_required" ? "待复核" as const : "已复核" as const,
    })),
]);

const currentEvidence = computed(() =>
  evidenceWithDevices.value.filter(
    (source) =>
      source.caseId === state.caseId &&
      (source.relatedFields.includes(state.fieldId) || currentField.value.sourceSystems.includes(source.system)),
  ),
);

const caseEvidence = computed(() => evidenceWithDevices.value.filter((source) => source.caseId === state.caseId));

const currentBedsideObservations = computed(() => allBedsideObservations.filter((observation) => observation.caseId === state.caseId));

const currentTrend = computed(() => allCaseTrends.find((trend) => trend.caseId === state.caseId) || allCaseTrends[0]);

const currentRawTables = computed(() => allRawTables.filter((table) => table.caseId === state.caseId));

const currentRawTable = computed(() => {
  return currentRawTables.value.find((table) => table.id === state.rawTableId) || currentRawTables.value[0];
});

const currentLifecycle = computed(
  () => allPatientLifecycles.find((lifecycle) => lifecycle.caseId === state.caseId) || allPatientLifecycles[0],
);

const currentMappingFields = computed(() => [
  ...currentTemplate.value.fields,
  ...allDeviceMappingFields.filter((field) =>
    field.sourceSystems.some((system) => sourceSystems.value.includes(system)) || state.cohortId === "cohort-perio-aggressive",
  ),
]);

function ensureRawTable() {
  if (currentRawTables.value.length && !currentRawTables.value.some((table) => table.id === state.rawTableId)) {
    state.rawTableId = currentRawTables.value[0].id;
  }
}

export function useCrfStore() {
  ensureSelection();
  return {
    allDeviceReports,
    allPatientLifecycles,
    allRawTables,
    bedsideObservations: allBedsideObservations,
    caseEvidence,
    cases,
    caseTrends: allCaseTrends,
    candidates,
    cohorts,
    confirmField,
    countCaseStatus,
    currentBedsideObservations,
    currentCandidates,
    currentCase,
    currentCases,
    currentCohort,
    currentDeviceReports,
    currentEvidence,
    currentExportJobs,
    currentField,
    currentLifecycle,
    currentMappingFields,
    currentModule,
    currentQueryTemplate,
    currentQueryTemplates,
    currentRawTable,
    currentRawTables,
    currentTemplate,
    currentTrend,
    currentValue,
    deviceMappingFields: allDeviceMappingFields,
    deviceReports: allDeviceReports,
    ensureRawTable,
    exportJobs,
    fieldById,
    inputModeLabels,
    queryResults,
    queryTemplates,
    runMockScan,
    selectCase,
    selectCohort,
    selectField,
    selectModule,
    selectQueryTemplate,
    selectRawTable,
    setView,
    sourceSystems,
    state,
    statusLabels,
    updateCandidateStatus,
    updateFieldValue,
  };
}
