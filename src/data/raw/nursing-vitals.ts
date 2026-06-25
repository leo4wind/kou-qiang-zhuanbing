import type { RawTable } from "@/types";

export const nursingVitals: RawTable[] = [
  {
    caseId: "PERIO-2026-0301",
    id: "nursing_vitals",
    name: "牙周检查记录表",
    system: "牙周检查表",
    columns: ["记录时间", "PD均值", "BOP%", "CAL均值", "松动度"],
    rows: [
      { "记录时间": "2026-03-01 10:30", "PD均值": "4.2", "BOP%": "65%", "CAL均值": "3.8", "松动度": "I度" },
      { "记录时间": "2026-03-15 16:30", "PD均值": "3.9", "BOP%": "50%", "CAL均值": "3.8", "松动度": "I度" },
    ],
    linkedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f027_松动度"],
  },
  {
    caseId: "PERIO-2026-0312",
    id: "nursing_vitals",
    name: "牙周检查记录表",
    system: "牙周检查表",
    columns: ["记录时间", "PD均值", "BOP%", "CAL均值", "松动度"],
    rows: [
      { "记录时间": "2026-03-12 11:00", "PD均值": "5.1", "BOP%": "82%", "CAL均值": "5.8", "松动度": "II度" },
    ],
    linkedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f027_松动度"],
  },
  {
    caseId: "PERIO-2026-0320",
    id: "nursing_vitals",
    name: "牙周检查记录表",
    system: "牙周检查表",
    columns: ["记录时间", "PD均值", "BOP%", "CAL均值", "松动度"],
    rows: [
      { "记录时间": "2026-03-20 09:30", "PD均值": "2.8", "BOP%": "25%", "CAL均值": "2.0", "松动度": "无" },
    ],
    linkedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f027_松动度"],
  },
  {
    caseId: "PERIO-2026-0325",
    id: "nursing_vitals",
    name: "牙周检查记录表",
    system: "牙周检查表",
    columns: ["记录时间", "PD均值", "BOP%", "CAL均值", "松动度"],
    rows: [
      { "记录时间": "2026-03-25 15:00", "PD均值": "5.5", "BOP%": "78%", "CAL均值": "5.2", "松动度": "II度" },
    ],
    linkedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f027_松动度"],
  },
  {
    caseId: "PERIO-2026-0402",
    id: "nursing_vitals",
    name: "牙周检查记录表",
    system: "牙周检查表",
    columns: ["记录时间", "PD均值", "BOP%", "CAL均值", "松动度"],
    rows: [
      { "记录时间": "2026-04-02 14:00", "PD均值": "2.5", "BOP%": "70%", "CAL均值": "0", "松动度": "无" },
    ],
    linkedFields: ["f014_PD均值", "f015_CAL均值", "f016_BOP阳性率", "f027_松动度"],
  },
];
