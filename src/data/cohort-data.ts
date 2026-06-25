import type {
  BedsideObservation,
  CaseRecord,
  CaseTrend,
  CohortProject,
  CrfField,
  CrfModule,
  CrfTemplate,
  DeviceMappingField,
  DeviceReport,
  ExportJob,
  PatientLifecycle,
  QueryTemplate,
  RawTable,
  ScreeningCandidate,
  SourceEvidence,
} from "@/types";

function field(
  id: string,
  moduleId: string,
  module: string,
  label: string,
  sourceSystems: string[],
  inputMode: CrfField["inputMode"],
  control: CrfField["control"],
  options: string[] = [],
  notes = "",
): CrfField {
  return {
    id,
    moduleId,
    module,
    label,
    options,
    dataSource: sourceSystems.join(" / "),
    rootSource: sourceSystems[0] || "来源待确认",
    inputMode,
    rawInputMode: inputMode,
    annotationRequired: inputMode === "file_review",
    rawAnnotation: inputMode === "file_review" ? "需保留源文件并人工复核" : "",
    control,
    notes,
    sourceSystems,
  };
}

function mod(id: string, name: string, fields: CrfField[]): CrfModule {
  return {
    id,
    name,
    fieldCount: fields.length,
    sourceSystems: [...new Set(fields.flatMap((f) => f.sourceSystems))],
    fields,
  };
}

// ============================================================
// 第二队列 CRF 模板：侵袭性牙周炎风险因素队列
// ============================================================
const perioModules = [
  mod("perio2_m01_outcome", "治疗结局与随访", [
    field("perio2_outcome", "perio2_m01_outcome", "治疗结局与随访", "12个月治疗结局", ["EMR/门诊病历", "随访"], "review", "select", [
      "稳定",
      "改善",
      "进展",
      "失访",
    ]),
    field("perio2_followup_6m", "perio2_m01_outcome", "治疗结局与随访", "6个月随访是否完成", ["随访"], "manual", "select", [
      "已完成",
      "未完成",
      "失访",
    ]),
  ]),
  mod("perio2_m02_screening", "侵袭性牙周炎纳入标准", [
    field("perio2_age_under35", "perio2_m02_screening", "侵袭性牙周炎纳入标准", "年龄≤35岁", ["EMR/门诊病历"], "auto", "boolean", ["否", "是"]),
    field("perio2_bone_loss_over33", "perio2_m02_screening", "侵袭性牙周炎纳入标准", "影像学骨丧失>33%根长", ["影像/PACS"], "file_review", "boolean", ["否", "是"]),
    field("perio2_family_history", "perio2_m02_screening", "侵袭性牙周炎纳入标准", "一级亲属牙周病史", ["牙周检查表"], "manual", "boolean", ["否", "是"]),
  ]),
  mod("perio2_m03_micro", "微生物与免疫", [
    field("perio2_aa_detected", "perio2_m03_micro", "微生物与免疫", "Aa（伴放线聚集杆菌）检出", ["LIS/检验"], "auto", "boolean", ["阴性", "阳性"]),
    field("perio2_crp", "perio2_m03_micro", "微生物与免疫", "血清 CRP（mg/L）", ["LIS/检验"], "auto", "number", [], "炎症标志物"),
    field("perio2_neutrophil", "perio2_m03_micro", "微生物与免疫", "中性粒细胞功能检测", ["LIS/检验"], "manual", "select", ["正常", "异常", "未查"]),
  ]),
  mod("perio2_m04_probing", "牙周探诊（第二队列）", [
    field("perio2_pd_max", "perio2_m04_probing", "牙周探诊（第二队列）", "最大探诊深度（mm）", ["牙周检查表", "牙周电子探针"], "review", "number"),
    field("perio2_cal_max", "perio2_m04_probing", "牙周探诊（第二队列）", "最大附着丧失（mm）", ["牙周检查表", "牙周电子探针"], "review", "number"),
    field("perio2_missing_teeth", "perio2_m04_probing", "牙周探诊（第二队列）", "因牙周病缺失牙数", ["牙周检查表", "影像/PACS"], "review", "number"),
  ]),
  mod("perio2_m05_device", "设备参数（第二队列）", [
    field("perio2_probe_max_val", "perio2_m05_device", "设备参数（第二队列）", "电子探针PD最大值（mm）", ["牙周电子探针"], "file_review", "number", [], "从电子探针导出报告人工复核"),
    field("perio2_probe_min_val", "perio2_m05_device", "设备参数（第二队列）", "电子探针PD最小值（mm）", ["牙周电子探针"], "file_review", "number", [], "从电子探针导出报告人工复核"),
    field("perio2_cbct_bone_loss", "perio2_m05_device", "设备参数（第二队列）", "CBCT骨丧失百分比（%）", ["影像/PACS"], "file_review", "number", [], "在CBCT软件中测量并截图留证"),
    field("perio2_intraoral_scan", "perio2_m05_device", "设备参数（第二队列）", "口内扫描牙龈形态评估", ["口内扫描仪"], "file_review", "select", ["正常", "红肿", "退缩", "增生"]),
  ]),
];

export const perioCrfTemplate: CrfTemplate = {
  id: "perio-aggressive-v1",
  name: "口腔牙周科 侵袭性牙周炎 CRF",
  sourceFile: "口腔牙周科专病调研-侵袭性牙周炎CRF设计.xlsx",
  moduleCount: perioModules.length,
  fieldCount: perioModules.reduce((sum, m) => sum + m.fieldCount, 0),
  sourceSystemCounts: {},
  modules: perioModules,
  fields: perioModules.flatMap((m) => m.fields),
};

// ============================================================
// 第二队列病例
// ============================================================
export const perioCaseRecords: CaseRecord[] = [
  {
    id: "PERIO-2026-0601",
    bed: "牙周-08",
    demographics: "29岁 女",
    diagnosis: "侵袭性牙周炎（III期C级）/ Aa阳性",
    owner: "张医生",
    updatedAt: "2026-06-01 10:30",
    completion: 68,
    statusCounts: {
      manual_required: 12,
      review_required: 10,
      auto_filled: 22,
      missing: 5,
      source_unclear: 2,
      file_review_required: 8,
    },
    values: {
      "f001_年龄": { "value": "29", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 10:30" },
      "f002_性别": { "value": "女", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 10:30" },
      "f003_首诊日期": { "value": "2026-06-01", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 10:30" },
      "f004_牙周主诉": { "value": "牙齿松动", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-01 10:30" },
      "f005_刷牙频率": { "value": "≥2次/天", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f006_牙线使用": { "value": "偶尔使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f007_漱口水使用": { "value": "不使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f008_最近洁治": { "value": ">3年/从未", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f009_吸烟史": { "value": "从不吸烟", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-01 10:30" },
      "f010_吸烟量": { "value": "不适用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f011_糖尿病史": { "value": "无", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-01 10:30" },
      "f012_HbA1c": { "value": "5.0", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 10:30" },
      "f013_家族史": { "value": "父母有牙周病史", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 10:30" },
      "f014_PD均值": { "value": "5.5", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f015_CAL均值": { "value": "6.2", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f016_BOP阳性率": { "value": "88", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f017_REC均值": { "value": "3.0", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f018_PDge5mm位点数": { "value": "15", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f019_最大PD": { "value": "9", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f020_最大CAL": { "value": "10", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f021_最大REC": { "value": "5", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f022_最重牙位": { "value": "31", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f023_PLI": { "value": "1", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f024_GI": { "value": "3", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f025_OHIS": { "value": "2.2", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f026_BI": { "value": "4", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:00" },
      "f027_松动度": { "value": "II度（水平1-2mm）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f028_根分叉病变": { "value": "II度", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f029_根分叉受累牙数": { "value": "2", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f030_咬合创伤": { "value": "无", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f031_影像类型": { "value": "CBCT", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 11:30" },
      "f032_骨吸收程度": { "value": "重度伴垂直骨缺损", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f033_骨缺损形态": { "value": "垂直吸收", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f034_骨丧失百分比": { "value": "60", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-01 11:30" },
      "f035_余留牙数": { "value": "23", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 11:30" },
      "f036_牙周诊断类型": { "value": "侵袭性牙周炎", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-01 14:00" },
      "f037_分期": { "value": "III期（重度伴牙缺失）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f038_分级": { "value": "C级（快速进展）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f039_诊断依据": { "value": "29岁即骨丧失60%，Aa阳性，一级亲属牙周病史，符合侵袭性牙周炎临床特征", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f040_治疗阶段": { "value": "初诊评估", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f041_基础治疗内容": { "value": "口腔卫生宣教(OHI), 全口洁治, 龈下刮治+根面平整(SRP), 药物治疗", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f042_手术指征": { "value": "有（骨缺损需再生）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f043_维护间隔": { "value": "3个月", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f044_洁治日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f045_SRP日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f046_SRP象限数": { "value": "不适用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f047_局部用药": { "value": "未使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f048_手术类型": { "value": "未行手术", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 14:00" },
      "f049_手术日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f050_手术牙位": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f051_术后用药": { "value": "未使用", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-01 14:00" },
      "f052_3月复查日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f053_3月PD变化": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f054_6月复查日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f055_6月CAL变化": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
      "f056_12月结局": { "value": "未到随访时间", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-01 14:00" },
    },
  },
  {
    id: "PERIO-2026-0603",
    bed: "牙周-10",
    demographics: "33岁 男",
    diagnosis: "侵袭性牙周炎（III期C级）/ CRP升高",
    owner: "张医生",
    updatedAt: "2026-06-03 15:00",
    completion: 55,
    statusCounts: {
      manual_required: 16,
      review_required: 8,
      auto_filled: 18,
      missing: 10,
      source_unclear: 4,
      file_review_required: 8,
    },
    values: {
      "f001_年龄": { "value": "33", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 15:00" },
      "f002_性别": { "value": "男", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 15:00" },
      "f003_首诊日期": { "value": "2026-06-03", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 15:00" },
      "f004_牙周主诉": { "value": "咀嚼无力", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-03 15:00" },
      "f005_刷牙频率": { "value": "1次/天", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f006_牙线使用": { "value": "从不使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f007_漱口水使用": { "value": "不使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f008_最近洁治": { "value": ">3年/从未", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f009_吸烟史": { "value": "当前吸烟", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-03 15:00" },
      "f010_吸烟量": { "value": "<10支", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f011_糖尿病史": { "value": "无", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-03 15:00" },
      "f012_HbA1c": { "value": "5.3", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 15:00" },
      "f013_家族史": { "value": "不详", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:00" },
      "f014_PD均值": { "value": "5.0", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f015_CAL均值": { "value": "5.5", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f016_BOP阳性率": { "value": "75", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f017_REC均值": { "value": "2.5", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f018_PDge5mm位点数": { "value": "14", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f019_最大PD": { "value": "8", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f020_最大CAL": { "value": "8", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f021_最大REC": { "value": "4", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f022_最重牙位": { "value": "16", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f023_PLI": { "value": "2", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f024_GI": { "value": "2", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f025_OHIS": { "value": "2.8", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f026_BI": { "value": "3", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 15:30" },
      "f027_松动度": { "value": "I度（水平<1mm）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f028_根分叉病变": { "value": "I度", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f029_根分叉受累牙数": { "value": "1", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f030_咬合创伤": { "value": "无", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f031_影像类型": { "value": "CBCT", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 16:00" },
      "f032_骨吸收程度": { "value": "中重度（>33%）", "status": "review_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f033_骨缺损形态": { "value": "混合型", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f034_骨丧失百分比": { "value": "40", "status": "file_review_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:00" },
      "f035_余留牙数": { "value": "25", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 16:00" },
      "f036_牙周诊断类型": { "value": "侵袭性牙周炎", "status": "review_required", "confirmedBy": "张医生", "updatedAt": "2026-06-03 16:30" },
      "f037_分期": { "value": "III期（重度伴牙缺失）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f038_分级": { "value": "C级（快速进展）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f039_诊断依据": { "value": "33岁骨丧失40%，CRP 18mg/L显著升高，吸烟为协同危险因素", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f040_治疗阶段": { "value": "初诊评估", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f041_基础治疗内容": { "value": "口腔卫生宣教(OHI), 龈下刮治+根面平整(SRP), 药物治疗", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f042_手术指征": { "value": "有（PD≥5mm持续）", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f043_维护间隔": { "value": "3个月", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f044_洁治日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f045_SRP日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f046_SRP象限数": { "value": "不适用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f047_局部用药": { "value": "未使用", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f048_手术类型": { "value": "未行手术", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 16:30" },
      "f049_手术日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f050_手术牙位": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f051_术后用药": { "value": "未使用", "status": "auto_filled", "confirmedBy": "系统", "updatedAt": "2026-06-03 16:30" },
      "f052_3月复查日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f053_3月PD变化": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f054_6月复查日期": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f055_6月CAL变化": { "value": "", "status": "missing", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
      "f056_12月结局": { "value": "未到随访时间", "status": "manual_required", "confirmedBy": "", "updatedAt": "2026-06-03 16:30" },
    },
  },
];

// ============================================================
// 队列项目
// ============================================================
export const cohortProjects: CohortProject[] = [
  {
    id: "cohort-perio",
    name: "慢性牙周炎疗效研究队列",
    disease: "慢性牙周炎",
    owner: "王医生",
    members: ["王医生", "李医生", "赵研究员"],
    status: "active",
    crfTemplateId: "perio-v1",
    rules: {
      id: "rule-perio-root",
      logic: "AND",
      summary: "慢性牙周炎诊断 + 牙周探诊异常 + 影像学骨吸收证据",
      conditions: [
        {
          id: "rule-perio-diagnosis",
          sourceSystem: "EMR/门诊病历",
          field: "牙周诊断类型",
          operator: "contains",
          value: "慢性牙周炎",
          summary: "诊断命中慢性牙周炎",
        },
        {
          id: "rule-perio-pd",
          sourceSystem: "牙周检查表",
          field: "最大探诊深度",
          operator: ">=",
          value: "5",
          summary: "最大PD≥5mm",
        },
        {
          id: "rule-perio-bone",
          sourceSystem: "影像/PACS",
          field: "牙槽骨丧失百分比",
          operator: ">=",
          value: "15",
          summary: "影像学骨丧失≥15%根长",
        },
      ],
    },
    candidateCount: 8,
    enrolledCount: 3,
    withdrawnCount: 0,
    completion: 74,
    pendingReviewCount: 32,
    manualRequiredCount: 45,
    deviceMissingCount: 3,
    followupMissingCount: 5,
    mainCauseDistribution: [
      { label: "慢性牙周炎II期B级", value: 1 },
      { label: "慢性牙周炎I期A级", value: 1 },
      { label: "慢性牙周炎III期B级", value: 1 },
    ],
    updatedAt: "2026-04-02 16:00",
  },
  {
    id: "cohort-perio-aggressive",
    name: "侵袭性牙周炎风险因素队列",
    disease: "侵袭性牙周炎",
    owner: "张医生",
    members: ["张医生", "刘研究员"],
    status: "screening",
    crfTemplateId: "perio-aggressive-v1",
    rules: {
      id: "rule-aggressive-root",
      logic: "AND",
      summary: "年龄≤35岁 / 骨丧失>33% / 一级亲属牙周病史",
      conditions: [
        {
          id: "rule-aggressive-age",
          sourceSystem: "EMR/门诊病历",
          field: "年龄",
          operator: "<=",
          value: "35",
          summary: "年龄≤35岁",
        },
        {
          id: "rule-aggressive-bone",
          sourceSystem: "影像/PACS",
          field: "牙槽骨丧失百分比",
          operator: ">=",
          value: "33",
          summary: "骨丧失>33%根长",
        },
        {
          id: "rule-aggressive-family",
          sourceSystem: "牙周检查表",
          field: "牙周病家族史",
          operator: "contains",
          value: "牙周病史",
          summary: "一级亲属有牙周病史",
        },
      ],
    },
    candidateCount: 5,
    enrolledCount: 2,
    withdrawnCount: 0,
    completion: 52,
    pendingReviewCount: 18,
    manualRequiredCount: 28,
    deviceMissingCount: 5,
    followupMissingCount: 4,
    mainCauseDistribution: [
      { label: "侵袭性牙周炎III期C级", value: 2 },
    ],
    updatedAt: "2026-06-03 17:00",
  },
];

// ============================================================
// 筛查候选池
// ============================================================
export const screeningCandidates: ScreeningCandidate[] = [
  {
    id: "cand-perio-01",
    patientId: "P-2026-0301",
    cohortId: "cohort-perio",
    caseId: "PERIO-2026-0301",
    demographics: "52岁 男",
    diagnosis: "慢性牙周炎 / 2型糖尿病",
    matchedRules: ["诊断命中慢性牙周炎", "最大PD 7mm", "骨丧失 28%"],
    evidence: ["电子探针报告", "全景片", "LIS HbA1c 6.8%"],
    status: "enrolled",
    owner: "王医生",
    scannedAt: "2026-03-01 09:15",
    handledAt: "2026-03-01 11:30",
    note: "已完成初诊评估和全口SRP",
  },
  {
    id: "cand-perio-02",
    patientId: "P-2026-0312",
    cohortId: "cohort-perio",
    caseId: "PERIO-2026-0312",
    demographics: "35岁 女",
    diagnosis: "侵袭性牙周炎（III期C级）",
    matchedRules: ["诊断命中慢性牙周炎", "最大PD 10mm", "骨丧失 55%"],
    evidence: ["CBCT报告", "电子探针报告"],
    status: "enrolled",
    owner: "王医生",
    scannedAt: "2026-03-12 10:00",
    handledAt: "2026-03-12 15:00",
    note: "因侵袭性牙周炎特征，拟转至侵袭性牙周炎队列",
  },
  {
    id: "cand-perio-03",
    patientId: "P-2026-0320",
    cohortId: "cohort-perio",
    caseId: "PERIO-2026-0320",
    demographics: "28岁 男",
    diagnosis: "慢性牙周炎（I期A级）",
    matchedRules: ["诊断命中慢性牙周炎", "最大PD 5mm", "骨丧失 10%"],
    evidence: ["全景片", "牙周检查表"],
    status: "enrolled",
    owner: "李医生",
    scannedAt: "2026-03-20 08:45",
    handledAt: "2026-03-20 10:30",
  },
  {
    id: "cand-perio-04",
    patientId: "P-2026-0325",
    cohortId: "cohort-perio",
    caseId: "PERIO-2026-0325",
    demographics: "60岁 女",
    diagnosis: "慢性牙周炎 / 牙周脓肿 / 糖尿病",
    matchedRules: ["诊断命中慢性牙周炎", "最大PD 9mm", "骨丧失 45%"],
    evidence: ["CBCT", "急诊就诊记录"],
    status: "enrolled",
    owner: "李医生",
    scannedAt: "2026-03-25 14:20",
    handledAt: "2026-03-25 16:00",
    note: "47牙周脓肿急性期处理后入组",
  },
  {
    id: "cand-perio-05",
    patientId: "P-2026-0402",
    cohortId: "cohort-perio",
    demographics: "22岁 女",
    diagnosis: "牙龈炎 / 妊娠期",
    matchedRules: ["BOP 70%"],
    evidence: ["牙周检查表"],
    status: "excluded",
    owner: "王医生",
    scannedAt: "2026-04-02 13:10",
    handledAt: "2026-04-02 14:30",
    note: "CAL=0 排除牙周炎，诊断为妊娠期龈炎",
  },
  {
    id: "cand-aggressive-01",
    patientId: "P-2026-0601",
    cohortId: "cohort-perio-aggressive",
    caseId: "PERIO-2026-0601",
    demographics: "29岁 女",
    diagnosis: "侵袭性牙周炎（III期C级）",
    matchedRules: ["年龄≤35岁", "骨丧失>33%根长", "一级亲属有牙周病史"],
    evidence: ["CBCT 骨丧失60%", "家族史问卷", "LIS：Aa阳性"],
    status: "enrolled",
    owner: "张医生",
    scannedAt: "2026-06-01 10:30",
    handledAt: "2026-06-01 14:00",
  },
  {
    id: "cand-aggressive-02",
    patientId: "P-2026-0603",
    cohortId: "cohort-perio-aggressive",
    caseId: "PERIO-2026-0603",
    demographics: "33岁 男",
    diagnosis: "侵袭性牙周炎（III期C级）",
    matchedRules: ["年龄≤35岁", "骨丧失>33%根长", "吸烟史"],
    evidence: ["CBCT 骨丧失40%", "LIS：CRP 18mg/L"],
    status: "enrolled",
    owner: "张医生",
    scannedAt: "2026-06-03 15:00",
    handledAt: "2026-06-03 16:30",
  },
  {
    id: "cand-aggressive-03",
    patientId: "P-2026-0610",
    cohortId: "cohort-perio-aggressive",
    demographics: "28岁 男",
    diagnosis: "牙周炎？/ 疑似侵袭性",
    matchedRules: ["年龄≤35岁", "骨丧失>33%根长"],
    evidence: ["CBCT", "探诊结果"],
    status: "needs_data",
    owner: "张医生",
    scannedAt: "2026-06-10 09:00",
    note: "缺乏家族史问诊记录，需补填问卷",
  },
];

// ============================================================
// 第二队列设备报告
// ============================================================
export const perioDeviceReports: DeviceReport[] = perioCaseRecords.flatMap((caseRecord, index) => {
  const day = caseRecord.updatedAt.slice(0, 10);
  return [
    {
      id: `${caseRecord.id}-probe`,
      caseId: caseRecord.id,
      deviceName: "Florida 电子探针",
      system: "牙周电子探针",
      fileName: `Florida_Probe_${caseRecord.id}.pdf`,
      fileType: "PDF" as const,
      reportTime: `${day} 11:00`,
      status: index === 1 ? "missing" : "review_required" as const,
      previewTitle: "Florida电子探针全口探诊报告",
      conclusion: index === 1 ? "未上传设备文件" : "多条位点PD≥6mm，需人工复核BOP与CAL数据一致性。",
      extractedFields: [
        { label: "全口PD最大值", value: index === 1 ? "-" : String(8 + index * 1), unit: "mm" },
        { label: "全口CAL最大值", value: index === 1 ? "-" : String(7 + index * 1), unit: "mm" },
        { label: "BOP阳性位点数", value: index === 1 ? "-" : String(60 + index * 10) },
      ],
      relatedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率"],
    },
    {
      id: `${caseRecord.id}-cbct`,
      caseId: caseRecord.id,
      deviceName: "CBCT",
      system: "影像/PACS",
      fileName: `CBCT_${caseRecord.id}.dcm`,
      fileType: "PDF" as const,
      reportTime: `${day} 11:30`,
      status: "uploaded" as const,
      previewTitle: "CBCT 牙槽骨三维重建",
      conclusion: "多牙位骨缺损，垂直吸收形态，骨丧失百分比需逐牙位测量。",
      extractedFields: [
        { label: "骨丧失百分比（最重位点）", value: String(40 + index * 20), unit: "%" },
        { label: "骨缺损形态", value: index === 0 ? "垂直吸收" : "混合型" },
      ],
      relatedFields: ["f034_骨丧失百分比", "f033_骨缺损形态"],
    },
    {
      id: `${caseRecord.id}-ios`,
      caseId: caseRecord.id,
      deviceName: "3Shape 口内扫描仪",
      system: "口内扫描仪",
      fileName: `IOS_${caseRecord.id}.stl`,
      fileType: "PDF" as const,
      reportTime: `${day} 12:00`,
      status: index === 1 ? "missing" : "uploaded" as const,
      previewTitle: "口内扫描牙龈三维形态",
      conclusion: index === 1 ? "未上传口扫文件" : "牙龈退缩区域清晰可见，与探诊结果一致。",
      extractedFields: [
        { label: "牙龈退缩范围", value: index === 1 ? "-" : "多牙位" },
        { label: "牙龈形态", value: index === 1 ? "-" : "退缩" },
      ],
      relatedFields: ["f017_REC均值"],
    },
  ];
});

// ============================================================
// 第二队列趋势数据
// ============================================================
export const perioTrends: CaseTrend[] = perioCaseRecords.map((caseRecord, index) => ({
  caseId: caseRecord.id,
  points: [
    { time: `2026-06-0${index + 1} 10:30`, heartRate: 72 + index * 3, map: 92 + index * 2, temperature: 36.5 + index * 0.1 },
    { time: `2026-06-0${index + 1} 12:00`, heartRate: 75 + index * 2, map: 90 + index * 2, temperature: 36.7 },
    { time: `2026-06-0${index + 1} 15:00`, heartRate: 70 + index * 1, map: 91 + index * 1, temperature: 36.6 },
  ],
  events: [
    { time: `2026-06-0${index + 1} 11:00`, label: "Florida探针", value: index === 0 ? "PDmax=9" : "PDmax=8", system: "牙周电子探针" },
    { time: `2026-06-0${index + 1} 11:30`, label: "CBCT", value: `骨丧失${40 + index * 20}%`, system: "影像/PACS" },
  ],
}));

// ============================================================
// 第二队列床旁观察
// ============================================================
export const perioBedsideObservations: BedsideObservation[] = perioCaseRecords.flatMap((caseRecord) => [
  {
    id: `${caseRecord.id}-bop`,
    caseId: caseRecord.id,
    label: "BOP阳性率",
    value: caseRecord.id === "PERIO-2026-0601" ? "88" : "75",
    unit: "%",
    observedAt: caseRecord.updatedAt,
    observer: "张医生",
    source: "牙周检查表",
    status: "manual_required",
  },
  {
    id: `${caseRecord.id}-mobility`,
    caseId: caseRecord.id,
    label: "松动度最重",
    value: caseRecord.id === "PERIO-2026-0601" ? "II度" : "I度",
    unit: "",
    observedAt: caseRecord.updatedAt,
    observer: "张医生",
    source: "牙周检查表",
    status: "manual_required",
  },
]);

// ============================================================
// 第二队列来源证据
// ============================================================
export const perioSourceEvidence: SourceEvidence[] = perioCaseRecords.flatMap((caseRecord, index) => [
  {
    id: `${caseRecord.id}-ev-probe`,
    caseId: caseRecord.id,
    system: "牙周电子探针",
    title: "Florida电子探针全口探查报告",
    time: `${caseRecord.updatedAt.slice(0, 10)} 11:00`,
    snippet: index === 0
      ? "全口探诊完成，PDmax=9mm位于31近中，CALmax=10mm，BOP阳性率88%。"
      : "全口探诊完成，PDmax=8mm位于16远中，CALmax=8mm，BOP阳性率75%。",
    relatedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f019_最大PD", "f020_最大CAL"],
    fileType: "PDF",
    fileUrl: `/mock/perio/${caseRecord.id}/probe.pdf`,
    previewTitle: "Florida 探针报告",
    extractedFields: [
      { label: "全口PD均值", value: index === 0 ? "5.5" : "5.0", unit: "mm" },
      { label: "全口CAL均值", value: index === 0 ? "6.2" : "5.5", unit: "mm" },
      { label: "BOP%", value: index === 0 ? "88" : "75", unit: "%" },
    ],
    reviewStatus: "待复核",
  },
  {
    id: `${caseRecord.id}-ev-cbct`,
    caseId: caseRecord.id,
    system: "影像/PACS",
    title: "CBCT牙槽骨三维分析",
    time: `${caseRecord.updatedAt.slice(0, 10)} 11:30`,
    snippet: `影像提示多牙位牙槽骨丧失${40 + index * 20}%，垂直吸收形态，累及根分叉区域。`,
    relatedFields: ["f034_骨丧失百分比", "f033_骨缺损形态", "f032_骨吸收程度"],
    fileType: "PDF",
    fileUrl: `/mock/perio/${caseRecord.id}/cbct.pdf`,
    previewTitle: "CBCT分析报告",
    reviewStatus: "已复核",
  },
  {
    id: `${caseRecord.id}-ev-lab`,
    caseId: caseRecord.id,
    system: "LIS/检验",
    title: "血清学检验",
    time: `${caseRecord.updatedAt.slice(0, 10)} 10:00`,
    snippet: index === 0
      ? "Aa（伴放线聚集杆菌）：阳性。CRP：15 mg/L。"
      : "Aa（伴放线聚集杆菌）：阴性。CRP：18 mg/L。",
    relatedFields: ["f012_HbA1c"],
    reviewStatus: "已复核",
  },
]);

// ============================================================
// 第二队列原始资料表
// ============================================================
export const perioRawTables: RawTable[] = perioCaseRecords.flatMap((caseRecord) => [
  {
    id: "patient_profile",
    caseId: caseRecord.id,
    name: "基本信息",
    system: "EMR/门诊病历",
    columns: ["字段", "值", "来源"],
    rows: [
      { 字段: "姓名", 值: "***", 来源: "门诊挂号" },
      { 字段: "年龄", 值: caseRecord.demographics.slice(0, 2).trim() + "岁", 来源: "门诊挂号" },
      { 字段: "性别", 值: caseRecord.demographics.includes("男") ? "男" : "女", 来源: "门诊挂号" },
      { 字段: "床位", 值: caseRecord.bed, 来源: "牙周科诊室排班" },
    ],
    linkedFields: ["f001_年龄", "f002_性别"],
  },
  {
    id: "exam_reports",
    caseId: caseRecord.id,
    name: "影像检查",
    system: "影像/PACS",
    columns: ["时间", "检查", "结论"],
    rows: [{
      时间: caseRecord.updatedAt,
      检查: "CBCT",
      结论: `牙槽骨丧失${40 + (caseRecord.id === "PERIO-2026-0601" ? 20 : 0)}%，垂直骨缺损，需结合临床探诊。`,
    }],
    linkedFields: ["f034_骨丧失百分比", "f033_骨缺损形态"],
  },
]);

// ============================================================
// 患者生命周期
// ============================================================
export const patientLifecycles: PatientLifecycle[] = [
  ...[
    "PERIO-2026-0301", "PERIO-2026-0312", "PERIO-2026-0320", "PERIO-2026-0325",
  ].map((caseId, index) => ({
    id: `life-${caseId}`,
    caseId,
    cohortId: "cohort-perio",
    events: [
      { id: `${caseId}-first`, stage: "门诊" as const, time: `2026-03-${String(index * 7 + 1).padStart(2, "0")} 09:00`, title: "牙周科初诊", description: "完成牙周检查表和影像学检查。", sourceSystem: "EMR/门诊病历" },
      { id: `${caseId}-device`, stage: "住院" as const, time: `2026-03-${String(index * 7 + 1).padStart(2, "0")} 11:00`, title: "设备采集", description: "Florida探针/CBCT/口扫离线报告上传。", sourceSystem: "牙周电子探针" },
      { id: `${caseId}-treat`, stage: "门诊" as const, time: `2026-03-${String(index * 7 + 8).padStart(2, "0")} 14:00`, title: "基础治疗", description: "全口SRP治疗完成。", sourceSystem: "EMR/门诊病历" },
      { id: `${caseId}-follow`, stage: "随访" as const, time: `2026-06-${String(index + 1).padStart(2, "0")} 10:00`, title: "3月随访", description: "复查PD/CAL变化，评估治疗反应。", sourceSystem: "随访" },
    ],
  })),
  ...perioCaseRecords.map((caseRecord, index) => ({
    id: `life-${caseRecord.id}`,
    caseId: caseRecord.id,
    cohortId: "cohort-perio-aggressive",
    events: [
      { id: `${caseRecord.id}-ward`, stage: "门诊" as const, time: `2026-06-0${index + 1} 08:50`, title: "CBCT检查", description: "CBCT提示牙槽骨重度吸收。", sourceSystem: "影像/PACS", linkedFields: ["f034_骨丧失百分比"] },
      { id: `${caseRecord.id}-probe`, stage: "门诊" as const, time: `2026-06-0${index + 1} 10:15`, title: "电子探针采集", description: "Florida探针全口探查完成。", sourceSystem: "牙周电子探针", linkedFields: ["f014_PD均值"] },
      { id: `${caseRecord.id}-lab`, stage: "门诊" as const, time: `2026-06-0${index + 1} 14:00`, title: "检验结果", description: "血清CRP/Aa检测出结果。", sourceSystem: "LIS/检验" },
    ],
  })),
];

// ============================================================
// 第二队列设备映射字段
// ============================================================
export const perioDeviceMappingFields: DeviceMappingField[] = [
  {
    id: "dmap-perio-probe",
    module: "牙周探诊（全口均值）",
    label: "Florida探针 / 电子探针组合参数",
    options: [],
    sourceSystems: ["牙周电子探针"],
    dataSource: "Florida探针PDF报告",
    rootSource: "牙周电子探针 PDF/CSV 导出",
    inputMode: "file_review",
    notes: "需人工复核探诊数据与临床检查一致性",
    annotationRequired: true,
  },
  {
    id: "dmap-perio-cbct",
    module: "影像学检查",
    label: "CBCT骨参数",
    options: [],
    sourceSystems: ["影像/PACS"],
    dataSource: "CBCT DICOM分析软件",
    rootSource: "CBCT 原始DICOM数据",
    inputMode: "file_review",
    notes: "在CBCT软件中逐牙位测量后录入",
    annotationRequired: true,
  },
  {
    id: "dmap-perio-ios",
    module: "影像学检查",
    label: "口内扫描牙龈形态",
    options: [],
    sourceSystems: ["口内扫描仪"],
    dataSource: "口扫STL/PLY文件",
    rootSource: "口内扫描原始数据",
    inputMode: "file_review",
    notes: "评估牙龈退缩和软组织形态",
    annotationRequired: true,
  },
];

// ============================================================
// 查询模板
// ============================================================
export const cohortQueryTemplates: QueryTemplate[] = [
  {
    id: "query-perio-bone-loss",
    cohortId: "cohort-perio",
    name: "骨丧失≥30%的慢性牙周炎",
    description: "筛选影像学骨丧失≥30%且PD≥7mm的患者",
    conditions: ["骨丧失≥30%", "最大PD≥7mm", "诊断=慢性牙周炎"],
    resultCaseIds: ["PERIO-2026-0312", "PERIO-2026-0325"],
    chartType: "trend",
    exportPreset: "CSV + 影像",
  },
  {
    id: "query-perio-diabetes",
    cohortId: "cohort-perio",
    name: "糖尿病共病牙周炎",
    description: "筛选HbA1c>6.5%的牙周炎患者",
    conditions: ["HbA1c>6.5%", "诊断=慢性牙周炎"],
    resultCaseIds: ["PERIO-2026-0301", "PERIO-2026-0325"],
    chartType: "distribution",
    exportPreset: "CSV",
  },
  {
    id: "query-aggressive-crp",
    cohortId: "cohort-perio-aggressive",
    name: "侵袭性牙周炎 CRP升高",
    description: "筛选CRP>10mg/L的侵袭性牙周炎患者",
    conditions: ["CRP>10mg/L", "诊断=侵袭性牙周炎"],
    resultCaseIds: ["PERIO-2026-0601", "PERIO-2026-0603"],
    chartType: "trend",
    exportPreset: "CSV + 影像 + 电子探针",
  },
];

// ============================================================
// 导出任务
// ============================================================
export const exportJobs: ExportJob[] = [
  {
    id: "export-perio-01",
    cohortId: "cohort-perio",
    queryTemplateId: "query-perio-bone-loss",
    name: "骨丧失≥30%病例数据集",
    includes: ["caseRecord", "rawTables", "全景片", "CBCT"],
    fileTypes: ["CSV", ".sps"],
    status: "ready",
    createdBy: "王医生",
    createdAt: "2026-04-01 10:00",
  },
  {
    id: "export-perio-02",
    cohortId: "cohort-perio-aggressive",
    queryTemplateId: "query-aggressive-crp",
    name: "侵袭性牙周炎CRP数据集",
    includes: ["caseRecord", "rawTables", "CBCT", "Florida探针PDF"],
    fileTypes: ["CSV", ".sps"],
    status: "running",
    createdBy: "张医生",
    createdAt: "2026-06-05 14:00",
  },
  {
    id: "export-perio-03",
    cohortId: "cohort-perio",
    name: "牙周全量数据库",
    includes: ["caseRecord", "rawTables", "CBCT", "LIS结果", "口扫STL"],
    fileTypes: ["CSV", ".sps"],
    status: "finished",
    createdBy: "李医生",
    createdAt: "2026-03-28 09:00",
  },
];
