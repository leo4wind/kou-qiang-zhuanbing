<script setup lang="ts">
import { Box, Download } from "@element-plus/icons-vue";
import { ref } from "vue";

import CrfDetailDrawer from "@/components/CrfDetailDrawer.vue";
import { useCrfStore } from "@/composables/useCrfStore";
import type { CaseRecord, ExportJob, QueryTemplate } from "@/types";

const { currentCases, currentCohort, currentExportJobs, currentQueryTemplates, currentTemplate } = useCrfStore();

const drawerVisible = ref(false);
const selectedCase = ref<CaseRecord>();

const exportPresets = [
  { label: "结构化 caseRecord", description: "CRF 字段值、状态、确认人、更新时间" },
  { label: "原始多表 rawTables", description: "EMR/LIS/PACS/护理/评分表/随访原始表" },
  { label: "SPSS 原型包", description: "CSV 数据 + .sps 变量标签/值标签脚本" },
  { label: "多模态源文件包", description: "Florida 探针、CBCT、口内扫描、全景片、PACS 缩略图" },
];

function firstCaseForTemplate(template?: QueryTemplate) {
  const resultIds = template?.resultCaseIds || [];
  return currentCases.value.find((caseRecord) => resultIds.includes(caseRecord.id)) || currentCases.value[0];
}

function openTemplateDetail(template: QueryTemplate) {
  selectedCase.value = firstCaseForTemplate(template);
  drawerVisible.value = true;
}

function openExportDetail(job: ExportJob) {
  const template = currentQueryTemplates.value.find((item) => item.id === job.queryTemplateId);
  selectedCase.value = firstCaseForTemplate(template);
  drawerVisible.value = true;
}
</script>

<template>
  <section class="view-stack">
    <el-card shadow="never" class="work-card">
      <div class="card-header">
        <div>
          <p class="eyebrow">报表与数据集导出</p>
          <h2>{{ currentCohort.name }}</h2>
        </div>
        <el-button :icon="Download" type="primary">生成导出任务</el-button>
      </div>
    </el-card>

    <div class="export-preset-grid">
      <el-card v-for="preset in exportPresets" :key="preset.label" shadow="never" class="metric-card export-preset-card">
        <el-icon><Box /></el-icon>
        <strong>{{ preset.label }}</strong>
        <span>{{ preset.description }}</span>
      </el-card>
    </div>

    <el-card shadow="never" class="work-card">
      <template #header>
        <div class="panel-title">
          <strong>可用查询模板</strong>
          <el-tag effect="plain">{{ currentQueryTemplates.length }} 个</el-tag>
        </div>
      </template>
      <div class="query-template-grid">
        <div v-for="template in currentQueryTemplates" :key="template.id" class="query-template-card">
          <div class="panel-title">
            <strong>{{ template.name }}</strong>
            <el-tag effect="plain">{{ template.chartType }}</el-tag>
          </div>
          <p class="muted">{{ template.description }}</p>
          <div class="condition-strip">
            <el-tag v-for="condition in template.conditions" :key="condition" size="small" effect="plain">
              {{ condition }}
            </el-tag>
          </div>
          <div class="panel-title export-template-footer">
            <p class="muted">导出预设：{{ template.exportPreset }}</p>
            <el-button size="small" type="primary" plain @click="openTemplateDetail(template)">详情</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="work-card">
      <template #header>
        <div class="panel-title">
          <strong>导出任务</strong>
          <el-tag type="success" effect="plain">{{ currentExportJobs.length }} 个</el-tag>
        </div>
      </template>
      <el-table :data="currentExportJobs" stripe height="360">
        <el-table-column label="任务" min-width="230">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
            <div class="muted">{{ row.createdBy }} · {{ row.createdAt }}</div>
          </template>
        </el-table-column>
        <el-table-column label="包含内容" min-width="280">
          <template #default="{ row }">
            <div class="tag-stack">
              <el-tag v-for="item in row.includes" :key="item" size="small" effect="plain">{{ item }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="文件类型" min-width="220">
          <template #default="{ row }">
            {{ row.fileTypes.join(" / ") }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="row.status === 'finished' ? 'success' : row.status === 'running' ? 'warning' : 'info'" effect="plain">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="right" width="190">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" type="primary" plain @click="openExportDetail(row)">详情</el-button>
              <el-button :icon="Download" size="small" :disabled="row.status !== 'finished'">下载</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <CrfDetailDrawer v-model:visible="drawerVisible" :case-record="selectedCase" :template="currentTemplate" />
  </section>
</template>
