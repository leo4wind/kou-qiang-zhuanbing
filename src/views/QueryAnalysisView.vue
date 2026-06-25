<script setup lang="ts">
import { Download, Search } from "@element-plus/icons-vue";
import { computed, ref } from "vue";

import CrfDetailDrawer from "@/components/CrfDetailDrawer.vue";
import { useCrfStore } from "@/composables/useCrfStore";
import type { CaseRecord } from "@/types";

const {
  currentCases,
  currentCohort,
  currentQueryTemplate,
  currentQueryTemplates,
  currentTemplate,
  queryResults,
  selectCase,
  selectQueryTemplate,
  setView,
  state,
} = useCrfStore();

const drawerVisible = ref(false);
const selectedCase = ref<CaseRecord>();
const showAnalysisPanels = ref(false);

const outcomeRows = computed(() => {
  const rows = queryResults.value.length ? queryResults.value : currentCases.value;
  const groups = new Map<string, number>();
  rows.forEach((caseRecord) => {
    const text = Object.values(caseRecord.values)
      .slice(0, 6)
      .map((item) => item.value)
      .join(" ");
    const outcome = text.includes("死亡") ? "死亡/放弃治疗后死亡" : text.includes("存活") ? "存活/放弃治疗后存活" : "待随访";
    groups.set(outcome, (groups.get(outcome) || 0) + 1);
  });
  return [...groups.entries()].map(([label, value]) => ({ label, value }));
});

const kmPath = computed(() => {
  const count = Math.max(queryResults.value.length, 2);
  const points = [
    [36, 44],
    [150, 44],
    [150, 82 + count * 5],
    [275, 82 + count * 5],
    [275, 122 + count * 4],
    [410, 122 + count * 4],
    [410, 160 + count * 3],
    [540, 160 + count * 3],
  ];
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
});

const scoreTrendPath = computed(() => {
  const rows = currentCases.value;
  if (!rows.length) return "";
  return rows
    .map((caseRecord, index) => {
      const scoreValue = Number(Object.values(caseRecord.values).find((item) => item.value && !Number.isNaN(Number(item.value)))?.value || 8);
      const x = 48 + index * 148;
      const y = 190 - scoreValue * 7;
      return `${index === 0 ? "M" : "L"} ${x} ${Math.max(46, y)}`;
    })
    .join(" ");
});

function openExport() {
  setView("export");
}

function openDetail(caseRecord: CaseRecord) {
  selectedCase.value = caseRecord;
  drawerVisible.value = true;
}
</script>

<template>
  <section class="view-stack">
    <el-card shadow="never" class="work-card">
      <div class="card-header">
        <div>
          <p class="eyebrow">高级查询与组群分析</p>
          <h2>{{ currentCohort.name }}</h2>
        </div>
        <div class="query-header-actions">
          <el-switch v-model="showAnalysisPanels" active-text="显示统计图" inactive-text="隐藏统计图" />
          <el-button :icon="Download" type="primary" plain @click="openExport">导出结果</el-button>
        </div>
      </div>

      <div class="query-filter-grid">
        <el-select v-model="state.queryTemplateId" @change="selectQueryTemplate(String($event))">
          <el-option v-for="template in currentQueryTemplates" :key="template.id" :label="template.name" :value="template.id" />
        </el-select>
        <el-input :model-value="currentQueryTemplate?.description" readonly>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="condition-strip">
        <el-tag v-for="condition in currentQueryTemplate?.conditions || []" :key="condition" effect="plain">
          {{ condition }}
        </el-tag>
      </div>
    </el-card>

    <div :class="showAnalysisPanels ? 'analysis-grid' : 'analysis-single-grid'">
      <el-card shadow="never" class="work-card">
        <template #header>
          <div class="panel-title">
            <strong>查询结果</strong>
            <el-tag type="success" effect="plain">{{ queryResults.length }} 例</el-tag>
          </div>
        </template>
        <el-table :data="queryResults" stripe height="330">
          <el-table-column label="病例号" min-width="180">
            <template #default="{ row }">
              <strong>{{ row.id }}</strong>
              <div class="muted">{{ row.demographics }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="diagnosis" label="诊断摘要" min-width="220" />
          <el-table-column prop="completion" label="CRF 完成度" width="130">
            <template #default="{ row }">{{ row.completion }}%</template>
          </el-table-column>
          <el-table-column align="right" width="170">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="primary" plain @click="openDetail(row)">详情</el-button>
                <el-button size="small" @click="selectCase(row.id, 'crf')">填 CRF</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="showAnalysisPanels" shadow="never" class="work-card">
        <template #header>
          <div class="panel-title">
            <strong>牙周治疗结局分布</strong>
            <el-tag effect="plain">{{ currentQueryTemplate?.exportPreset }}</el-tag>
          </div>
        </template>
        <div class="distribution-list">
          <div v-for="item in outcomeRows" :key="item.label" class="distribution-row">
            <span>{{ item.label }}</span>
            <el-progress :percentage="Math.round((item.value / Math.max(queryResults.length, 1)) * 100)" :stroke-width="10" />
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="showAnalysisPanels" class="analysis-grid">
      <el-card shadow="never" class="work-card">
        <template #header>
          <div class="panel-title">
            <strong>Kaplan-Meier 生存曲线</strong>
            <el-tag effect="plain">Mock</el-tag>
          </div>
        </template>
        <svg class="analysis-chart" viewBox="0 0 590 240" role="img" aria-label="Kaplan-Meier 生存曲线">
          <line x1="36" y1="196" x2="552" y2="196" class="axis" />
          <line x1="36" y1="32" x2="36" y2="196" class="axis" />
          <path :d="kmPath" class="km-line" />
          <text x="38" y="224" class="axis-label">0 天</text>
          <text x="492" y="224" class="axis-label">90 天</text>
          <text x="42" y="52" class="axis-label">生存率</text>
        </svg>
      </el-card>

      <el-card shadow="never" class="work-card">
        <template #header>
          <div class="panel-title">
            <strong>PIM3 / PSS 趋势</strong>
            <el-tag effect="plain">危重度</el-tag>
          </div>
        </template>
        <svg class="analysis-chart" viewBox="0 0 590 240" role="img" aria-label="危重度评分趋势">
          <line x1="36" y1="196" x2="552" y2="196" class="axis" />
          <line x1="36" y1="32" x2="36" y2="196" class="axis" />
          <path :d="scoreTrendPath" class="trend-line hr-line" />
          <g v-for="(caseRecord, index) in currentCases" :key="caseRecord.id">
            <circle :cx="48 + index * 148" cy="190" r="4" class="event-dot" />
            <text :x="40 + index * 148" y="222" class="axis-label">{{ index + 1 }}</text>
          </g>
        </svg>
      </el-card>
    </div>

    <CrfDetailDrawer v-model:visible="drawerVisible" :case-record="selectedCase" :template="currentTemplate" />
  </section>
</template>
