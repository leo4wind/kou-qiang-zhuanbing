import type { BedsideObservation, CaseTrend, DeviceMappingField, DeviceReport } from "@/types";

const cases = ["PERIO-2026-0301", "PERIO-2026-0312", "PERIO-2026-0320", "PERIO-2026-0325"] as const;

const baseTimes: Record<(typeof cases)[number], string> = {
  "PERIO-2026-0301": "2026-03-01",
  "PERIO-2026-0312": "2026-03-12",
  "PERIO-2026-0320": "2026-03-20",
  "PERIO-2026-0325": "2026-03-25",
};

export const deviceReports: DeviceReport[] = cases.flatMap((caseId, caseIndex) => {
  const day = baseTimes[caseId];
  return [
    {
      id: `${caseId}-florida-probe`,
      caseId,
      deviceName: "Florida 电子探针",
      system: "牙周电子探针",
      fileName: `Florida_Probe_全口探查.pdf`,
      fileType: "PDF",
      reportTime: `${day} 10:30`,
      status: caseIndex === 2 ? "missing" : "review_required",
      previewTitle: "Florida电子探针全口探诊报告",
      conclusion: caseIndex === 2 ? "未上传设备文件" : "多条位点PD≥5mm，BOP阳性率偏高，需人工复核CAL数据。",
      extractedFields: [
        { label: "全口PD均值", value: caseIndex === 2 ? "-" : String(3.5 + caseIndex * 0.5), unit: "mm" },
        { label: "全口CAL均值", value: caseIndex === 2 ? "-" : String(3.0 + caseIndex * 0.4), unit: "mm" },
        { label: "BOP阳性率", value: caseIndex === 2 ? "-" : String(55 + caseIndex * 10), unit: "%" },
      ],
      relatedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率"],
    },
    {
      id: `${caseId}-cbct`,
      caseId,
      deviceName: "CBCT",
      system: "影像/PACS",
      fileName: `CBCT_牙槽骨分析.dcm`,
      fileType: "PDF",
      reportTime: `${day} 11:00`,
      status: "uploaded",
      previewTitle: "CBCT牙槽骨三维重建",
      conclusion: "多牙位牙槽骨吸收，需结合临床探诊综合评估分期。",
      extractedFields: [
        { label: "骨丧失百分比（最重位点）", value: String(15 + caseIndex * 10), unit: "%" },
        { label: "骨缺损形态", value: caseIndex % 2 === 0 ? "水平吸收" : "垂直吸收" },
      ],
      relatedFields: ["f034_骨丧失百分比", "f033_骨缺损形态"],
    },
    {
      id: `${caseId}-ios`,
      caseId,
      deviceName: "3Shape 口内扫描仪",
      system: "口内扫描仪",
      fileName: `口扫_三维模型.stl`,
      fileType: "PDF",
      reportTime: `${day} 11:30`,
      status: caseIndex === 1 ? "missing" : "uploaded",
      previewTitle: "口内扫描牙龈三维形态",
      conclusion: caseIndex === 1 ? "未上传口扫文件" : "牙龈退缩区域可辨，与探诊记录基本一致。",
      extractedFields: [
        { label: "牙龈退缩范围", value: caseIndex === 1 ? "-" : "局部多牙位" },
        { label: "牙龈形态评估", value: caseIndex === 1 ? "-" : caseIndex % 2 === 0 ? "退缩为主" : "红肿伴退缩" },
      ],
      relatedFields: ["f017_REC均值"],
    },
    {
      id: `${caseId}-opg`,
      caseId,
      deviceName: "全景X光机",
      system: "影像/PACS",
      fileName: `全景片_OPG.jpg`,
      fileType: "图片",
      reportTime: `${day} 09:30`,
      status: caseIndex === 3 ? "missing" : "uploaded",
      previewTitle: "口腔全景片",
      conclusion: caseIndex === 3 ? "未上传全景片" : "全口牙槽骨水平吸收，后牙区明显。",
      extractedFields: [
        { label: "骨吸收类型", value: caseIndex === 3 ? "-" : "水平型" },
        { label: "余留牙数", value: caseIndex === 3 ? "-" : String(28 - caseIndex) },
      ],
      relatedFields: ["f032_骨吸收程度", "f035_余留牙数"],
    },
  ];
});

export const bedsideObservations: BedsideObservation[] = cases.flatMap((caseId, caseIndex) => {
  const day = baseTimes[caseId];
  return [
    {
      id: `${caseId}-bop`,
      caseId,
      label: "BOP阳性率",
      value: String(55 + caseIndex * 10),
      unit: "%",
      observedAt: `${day} 10:00`,
      observer: "王医生",
      source: "牙周检查表",
      status: "manual_required",
    },
    {
      id: `${caseId}-mobility`,
      caseId,
      label: "松动度（最重）",
      value: caseIndex === 0 ? "I度" : caseIndex === 1 ? "II度" : caseIndex === 2 ? "无" : "II度",
      unit: "",
      observedAt: `${day} 10:15`,
      observer: "王医生",
      source: "牙周检查表",
      status: "manual_required",
    },
    {
      id: `${caseId}-furcation`,
      caseId,
      label: "根分叉病变（最重）",
      value: caseIndex === 0 ? "II度" : caseIndex === 1 ? "III度" : caseIndex === 2 ? "无" : "II度",
      unit: "",
      observedAt: `${day} 10:20`,
      observer: "王医生",
      source: "牙周检查表",
      status: "manual_required",
    },
  ];
});

export const caseTrends: CaseTrend[] = cases.map((caseId, caseIndex) => {
  const day = baseTimes[caseId];
  return {
    caseId,
    points: [
      { time: `${day} 09:00`, heartRate: 70 + caseIndex * 2, map: 90 + caseIndex, temperature: 36.4 + caseIndex * 0.1 },
      { time: `${day} 11:00`, heartRate: 72 + caseIndex * 2, map: 88 + caseIndex, temperature: 36.6 },
      { time: `${day} 15:00`, heartRate: 68 + caseIndex * 3, map: 89 + caseIndex, temperature: 36.5 },
    ],
    events: [
      { time: `${day} 10:30`, label: "Florida探针", value: `${String(3.5 + caseIndex * 0.5)}mm`, system: "牙周电子探针" },
      { time: `${day} 11:00`, label: "CBCT", value: `${15 + caseIndex * 10}%`, system: "影像/PACS" },
      { time: `${day} 11:30`, label: "口内扫描", value: caseIndex === 1 ? "缺失" : "已采集", system: "口内扫描仪" },
    ],
  };
});

export const deviceMappingFields: DeviceMappingField[] = [
  {
    id: "dmap-florida-pd",
    module: "牙周探诊（全口均值）",
    label: "Florida探针全口探查参数",
    options: [],
    sourceSystems: ["牙周电子探针"],
    dataSource: "Florida电子探针PDF/CSV导出",
    rootSource: "Florida电子探针原始数据",
    inputMode: "file_review",
    notes: "需人工复核探诊深度和附着丧失数据是否与临床检查一致",
    annotationRequired: true,
  },
  {
    id: "dmap-cbct-bone",
    module: "影像学检查",
    label: "CBCT骨丧失参数",
    options: [],
    sourceSystems: ["影像/PACS"],
    dataSource: "CBCT DICOM分析",
    rootSource: "CBCT原始DICOM数据",
    inputMode: "file_review",
    notes: "在CBCT软件中逐牙位测量牙槽嵴顶到釉牙骨质界的距离",
    annotationRequired: true,
  },
  {
    id: "dmap-ios-gingiva",
    module: "影像学检查",
    label: "口内扫描牙龈形态",
    options: [],
    sourceSystems: ["口内扫描仪"],
    dataSource: "口扫STL/PLY三维模型",
    rootSource: "口内扫描仪原始数据",
    inputMode: "file_review",
    notes: "评估牙龈退缩范围、角化龈宽度和软组织形态",
    annotationRequired: true,
  },
  {
    id: "dmap-opg-bone",
    module: "影像学检查",
    label: "全景片骨吸收评估",
    options: [],
    sourceSystems: ["影像/PACS"],
    dataSource: "全景片/PACS",
    rootSource: "全景X光机",
    inputMode: "file_review",
    notes: "全景片可快速评估整体骨吸收趋势，细节需CBCT确认",
    annotationRequired: true,
  },
];
