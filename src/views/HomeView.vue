<script setup lang="ts">
import { ArrowRight, Connection, DataAnalysis, DataBoard, DocumentChecked, Files } from "@element-plus/icons-vue";

import { useCrfStore } from "@/composables/useCrfStore";
import type { ViewName } from "@/types";

const { cohorts, currentCohort, selectCohort, setView, state } = useCrfStore();

const flowSteps = [
  { title: "设备对接", desc: "对接 Florida电子探针 / CBCT / 口内扫描仪 / 全景X光机等设备，上传 PDF / DICOM / STL 等源文件。" },
  { title: "数据对接", desc: "接入 EMR / LIS / PACS / 牙周检查表 / 随访等多源异构数据，统一结构化。" },
  { title: "建队列", desc: "创建牙周专病项目，配置负责人、成员、入排标准和 CRF 模板。" },
  { title: "筛患者", desc: "通过规则引擎模拟自动扫描门诊病历、LIS 与影像数据，生成候选池。" },
  { title: "确认入组", desc: "研究员查看命中规则和证据，确认入组、排除、暂缓或补资料。" },
  { title: "填 CRF", desc: "按队列模板完成自动带入、人工补录、字段确认和设备文件复核。" },
  { title: "追溯证据", desc: "在原始资料、设备文件视图、探诊趋势和全周期时间轴中核查来源。" },
  { title: "查询分析", desc: "按临床特征、探诊指标、影像参数和结局组合筛选病例。" },
  { title: "导出数据集", desc: "导出 caseRecord、rawTables、查询结果和多模态源文件包。" },
];

const modules: Array<{ title: string; desc: string; view: ViewName; icon: unknown }> = [
  { title: "项目/队列", desc: "管理多专病队列、入排规则和候选患者池。", view: "cohorts", icon: DataBoard },
  { title: "队列看板", desc: "查看入组进度、CRF 完成度、待办和设备缺失。", view: "dashboard", icon: DataAnalysis },
  { title: "CRF 填审", desc: "按当前队列模板完成字段录入、确认和复核。", view: "crf", icon: DocumentChecked },
  { title: "原始资料", desc: "追溯原始多表、设备文件、趋势和患者全周期。", view: "raw", icon: Files },
  { title: "字段映射", desc: "查看字段来源系统、输入策略和设备融合字段。", view: "mapping", icon: Connection },
  { title: "查询分析", desc: "保存组合查询，查看结果并按需打开统计图。", view: "query", icon: DataAnalysis },
  { title: "导出中心", desc: "生成 CSV、.sps 与多模态源文件导出任务。", view: "export", icon: Files },
];
</script>

<template>
  <section class="home-view">
    <el-card shadow="never" class="home-hero-card">
      <div class="home-hero-content">
        <div>
          <p class="eyebrow">牙周病 专病科研工作流</p>
          <h2>从队列定义到数据集导出的牙周专病库原型</h2>
          <p>
            当前原型围绕牙周多专病队列管理、可配置 CRF、来源证据追溯、设备数据融合、查询分析和导出交付展开。
          </p>
        </div>
        <div class="home-current-cohort">
          <span>当前队列</span>
          <el-select v-model="state.cohortId" style="width: 260px" @change="selectCohort(String($event), 'home')">
            <el-option v-for="cohort in cohorts" :key="cohort.id" :label="cohort.name" :value="cohort.id" />
          </el-select>
          <small>{{ currentCohort.disease }} · 入组 {{ currentCohort.enrolledCount }} 人 · 完成度 {{ currentCohort.completion }}%</small>
          <el-button type="primary" :icon="ArrowRight" @click="setView('cohorts')">进入项目/队列</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="work-card">
      <template #header>
        <div class="panel-title">
          <strong>项目流程</strong>
          <el-tag effect="plain">9 步闭环</el-tag>
        </div>
      </template>
      <div class="home-flow">
        <div v-for="(step, index) in flowSteps" :key="step.title" class="home-flow-step">
          <span>{{ String(index + 1).padStart(2, "0") }}</span>
          <strong>{{ step.title }}</strong>
          <p>{{ step.desc }}</p>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="work-card">
      <template #header>
        <div class="panel-title">
          <strong>功能模块</strong>
          <el-tag effect="plain">{{ modules.length }} 个入口</el-tag>
        </div>
      </template>
      <div class="home-module-grid">
        <button v-for="module in modules" :key="module.title" class="home-module-card" type="button" @click="setView(module.view)">
          <el-icon>
            <component :is="module.icon" />
          </el-icon>
          <strong>{{ module.title }}</strong>
          <p>{{ module.desc }}</p>
        </button>
      </div>
    </el-card>

    <el-card shadow="never" class="work-card">
      <template #header>
        <div class="panel-title">
          <strong>当前 Mock 队列</strong>
          <el-tag effect="plain">{{ cohorts.length }} 个</el-tag>
        </div>
      </template>
      <el-table :data="cohorts" stripe>
        <el-table-column prop="name" label="队列名称" min-width="220" />
        <el-table-column prop="disease" label="专病类型" width="160" />
        <el-table-column prop="owner" label="负责人" width="140" />
        <el-table-column label="入组 / 候选" width="160">
          <template #default="{ row }">{{ row.enrolledCount }} / {{ row.candidateCount }}</template>
        </el-table-column>
        <el-table-column label="CRF 完成度" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.completion" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column align="right" width="120">
          <template #default>
            <el-button size="small" type="primary" plain @click="setView('dashboard')">看板</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
