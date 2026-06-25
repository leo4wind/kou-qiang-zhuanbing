import type { SourceEvidence } from "@/types";

const perioCases = ["PERIO-2026-0301", "PERIO-2026-0312", "PERIO-2026-0320", "PERIO-2026-0325", "PERIO-2026-0402"] as const;

const caseData: Record<string, { day: string; pd: string; cal: string; bop: string; bone: string; diag: string }> = {
  "PERIO-2026-0301": { day: "2026-03-01", pd: "4.2", cal: "3.8", bop: "65", bone: "28", diag: "慢性牙周炎（II期B级）" },
  "PERIO-2026-0312": { day: "2026-03-12", pd: "5.1", cal: "5.8", bop: "82", bone: "55", diag: "侵袭性牙周炎（III期C级）" },
  "PERIO-2026-0320": { day: "2026-03-20", pd: "2.8", cal: "2.0", bop: "25", bone: "10", diag: "慢性牙周炎（I期A级）" },
  "PERIO-2026-0325": { day: "2026-03-25", pd: "5.5", cal: "5.2", bop: "78", bone: "45", diag: "慢性牙周炎（III期B级）/ 牙周脓肿" },
  "PERIO-2026-0402": { day: "2026-04-02", pd: "2.5", cal: "0", bop: "70", bone: "5", diag: "牙龈炎（菌斑性）/ 妊娠期龈炎" },
};

export const sourceEvidence: SourceEvidence[] = perioCases.flatMap((caseId) => {
  const d = caseData[caseId];
  return [
    {
      id: `${caseId}-ev-profile`,
      caseId,
      system: "EMR/门诊病历",
      title: "门诊病历-初诊记录",
      time: `${d.day} 09:00`,
      snippet: `患者就诊于牙周科，主诉牙龈出血/牙齿松动。初步诊断：${d.diag}。建议行全口牙周检查及影像学评估。`,
      relatedFields: ["f001_年龄", "f002_性别", "f003_首诊日期", "f004_牙周主诉", "f036_牙周诊断类型"],
      fileType: "PDF",
      fileUrl: `/mock/perio/${caseId}/emr.pdf`,
      previewTitle: "门诊病历",
      reviewStatus: "已复核",
    },
    {
      id: `${caseId}-ev-probe`,
      caseId,
      system: "牙周电子探针",
      title: "Florida电子探针全口探查报告",
      time: `${d.day} 10:30`,
      snippet: `全口探诊完成：PD均值${d.pd}mm，CAL均值${d.cal}mm，BOP阳性率${d.bop}%。${d.pd === "0" ? "未探及附着丧失，符合牙龈炎诊断。" : "多条位点PD≥5mm，需关注牙周破坏进展。"}`,
      relatedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f019_最大PD", "f020_最大CAL"],
      fileType: "PDF",
      fileUrl: `/mock/perio/${caseId}/probe.pdf`,
      previewTitle: "Florida探针报告",
      extractedFields: [
        { label: "全口PD均值", value: d.pd, unit: "mm" },
        { label: "全口CAL均值", value: d.cal, unit: "mm" },
        { label: "BOP%", value: d.bop, unit: "%" },
      ],
      reviewStatus: "待复核",
    },
    {
      id: `${caseId}-ev-imaging`,
      caseId,
      system: "影像/PACS",
      title: "影像学检查报告",
      time: `${d.day} 11:00`,
      snippet: `影像检查提示牙槽骨吸收约${d.bone}%，${Number(d.bone) > 33 ? "骨吸收程度超过根长1/3，符合中重度牙周炎影像学表现。" : Number(d.bone) < 15 ? "骨吸收轻微，未达牙周炎影像学诊断标准。" : "骨吸收位于15%-33%之间，符合中度牙周炎。"}`,
      relatedFields: ["f031_影像类型", "f032_骨吸收程度", "f033_骨缺损形态", "f034_骨丧失百分比"],
      fileType: "图片",
      fileUrl: `/mock/perio/${caseId}/imaging.jpg`,
      previewTitle: "影像学报告",
      reviewStatus: "已复核",
    },
    {
      id: `${caseId}-ev-lis`,
      caseId,
      system: "LIS/检验",
      title: "LIS检验报告",
      time: `${d.day} 09:30`,
      snippet: caseId === "PERIO-2026-0301"
        ? "HbA1c 6.8%，提示2型糖尿病控制良好。CRP 8.5mg/L轻度升高。"
        : caseId === "PERIO-2026-0325"
        ? "HbA1c 9.1%，提示血糖控制不佳。CRP 22mg/L显著升高，符合急性炎症反应。"
        : caseId === "PERIO-2026-0312"
        ? "CRP 15mg/L升高，HbA1c正常。需关注全身炎症负荷对牙周的影响。"
        : "HbA1c及CRP均在正常范围内。",
      relatedFields: ["f011_糖尿病史", "f012_HbA1c"],
      reviewStatus: "已复核",
    },
    {
      id: `${caseId}-ev-periochart`,
      caseId,
      system: "牙周检查表",
      title: "牙周检查表",
      time: `${d.day} 10:00`,
      snippet: caseId === "PERIO-2026-0402"
        ? "BOP 70%，但CAL=0mm，无附着丧失。口腔卫生良好(PLI=1)。妊娠期龈炎诊断明确。"
        : `BOP ${d.bop}%，CAL均值${d.cal}mm，松动度和根分叉病变已记录。口腔卫生指数OHI-S提示需加强口腔卫生维护。`,
      relatedFields: ["f023_PLI", "f024_GI", "f025_OHIS", "f026_BI", "f027_松动度", "f028_根分叉病变"],
      reviewStatus: "待复核",
    },
    {
      id: `${caseId}-ev-treat`,
      caseId,
      system: "EMR/门诊病历",
      title: "治疗记录",
      time: d.day,
      snippet: caseId === "PERIO-2026-0402" || caseId === "PERIO-2026-0320"
        ? "已完成全口洁治+口腔卫生宣教。嘱6个月后复诊维护。"
        : "已完成全口龈下刮治+根面平整(SRP)，局部米诺环素凝胶置入。嘱3个月后复诊。",
      relatedFields: ["f040_治疗阶段", "f041_基础治疗内容", "f044_洁治日期", "f045_SRP日期"],
      reviewStatus: caseId === "PERIO-2026-0402" || caseId === "PERIO-2026-0320" ? "已复核" : "待复核",
    },
  ];
});
