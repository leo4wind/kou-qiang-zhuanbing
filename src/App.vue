<script setup lang="ts">
import { Connection, DataBoard, DocumentChecked, Files, Monitor } from "@element-plus/icons-vue";
import { computed } from "vue";

import CaseSummary from "@/components/CaseSummary.vue";
import { useCrfStore } from "@/composables/useCrfStore";
import CohortCenterView from "@/views/CohortCenterView.vue";
import CrfReviewView from "@/views/CrfReviewView.vue";
import DashboardView from "@/views/DashboardView.vue";
import DeviceFilesView from "@/views/DeviceFilesView.vue";
import ExportCenterView from "@/views/ExportCenterView.vue";
import FieldMappingView from "@/views/FieldMappingView.vue";
import HomeView from "@/views/HomeView.vue";
import QueryAnalysisView from "@/views/QueryAnalysisView.vue";
import RawMaterialsView from "@/views/RawMaterialsView.vue";
import type { ViewName } from "@/types";

const { setView, state } = useCrfStore();

const pageTitle = computed(() => {
  const labels: Record<ViewName, string> = {
    home: "首页",
    raw_device: "设备文件视图",
    raw: "数据来源",
    cohorts: "项目/队列管理中心",
    dashboard: "队列全景看板",
    crf: "CRF 填审工作站",
    mapping: "字段映射",
    query: "高级查询与分析",
    export: "报表与数据集导出",
  };
  return labels[state.view];
});

function handleMenuSelect(index: string) {
  setView(index as ViewName);
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="184px" class="app-aside">
      <div class="brand">
        <h1>专病库</h1>
      </div>
      <el-menu class="side-menu" :default-active="state.view" @select="handleMenuSelect">
        <el-menu-item index="home">
          <el-icon><DataBoard /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="raw_device">
          <el-icon><Monitor /></el-icon>
          <span>设备文件视图</span>
        </el-menu-item>
        <el-menu-item index="raw">
          <el-icon><Files /></el-icon>
          <span>数据来源</span>
        </el-menu-item>
        <el-menu-item index="cohorts">
          <el-icon><DataBoard /></el-icon>
          <span>项目/队列</span>
        </el-menu-item>
        <el-menu-item index="dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>队列看板</span>
        </el-menu-item>

        <el-menu-item index="crf">
          <el-icon><DocumentChecked /></el-icon>
          <span>CRF 填审</span>
        </el-menu-item>
        <el-menu-item index="mapping">
          <el-icon><Connection /></el-icon>
          <span>字段映射</span>
        </el-menu-item>
        <el-menu-item index="query">
          <el-icon><Connection /></el-icon>
          <span>查询分析</span>
        </el-menu-item>
        <el-menu-item index="export">
          <el-icon><Files /></el-icon>
          <span>导出中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header" height="112px">
        <div>
          <h2>{{ pageTitle }}</h2>
        </div>
        <CaseSummary />
      </el-header>

      <el-main class="app-main">
        <HomeView v-if="state.view === 'home'" />
        <DeviceFilesView v-else-if="state.view === 'raw_device'" />
        <CohortCenterView v-else-if="state.view === 'cohorts'" />
        <DashboardView v-else-if="state.view === 'dashboard'" />
        <RawMaterialsView v-else-if="state.view === 'raw'" />
        <CrfReviewView v-else-if="state.view === 'crf'" />
        <FieldMappingView v-else-if="state.view === 'mapping'" />
        <QueryAnalysisView v-else-if="state.view === 'query'" />
        <ExportCenterView v-else />
      </el-main>
    </el-container>
  </el-container>
</template>
