<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Film, List, Grid3X3, Trash2, Play, FolderOpen, CheckSquare, Square, Clock, Calendar, HardDrive, FileType } from 'lucide-vue-next'
import { useRecorder, type SavedRecord } from '../composables/useRecorder'
import { toMediaUrl } from '../utils/media'

dayjs.extend(duration)

const { getRecords, deleteRecord } = useRecorder()

const records = ref<SavedRecord[]>([])
const viewMode = ref<'list' | 'grid'>('list')
const selectedIds = ref<Set<string>>(new Set())
const loading = ref(false)

const allSelected = computed(() => {
  return records.value.length > 0 && records.value.every((r) => selectedIds.value.has(r.id))
})

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    records.value.forEach((r) => selectedIds.value.add(r.id))
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function isSelected(id: string): boolean {
  return selectedIds.value.has(id)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatDuration(seconds: number): string {
  const d = dayjs.duration(Math.floor(seconds || 0), 'seconds')
  const h = d.hours()
  const m = d.minutes().toString().padStart(2, '0')
  const s = d.seconds().toString().padStart(2, '0')
  if (h > 0) return `${h}:${m}:${s}`
  return `${m}:${s}`
}

function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

function getFormatFromName(name: string): string {
  const match = name.match(/\.([^.]+)$/)
  return match ? match[1].toUpperCase() : 'UNKNOWN'
}

function onVideoMetadataLoaded(e: Event) {
  const video = e.target as HTMLVideoElement
  video.currentTime = 0.1
}

async function loadRecords() {
  loading.value = true
  try {
    records.value = await getRecords()
  } catch (err) {
    console.error('Failed to load records:', err)
  } finally {
    loading.value = false
  }
}

function handlePlay(record: SavedRecord) {
  window.api.player.open(record.path)
}

function handleShowInFolder(record: SavedRecord) {
  window.api.record.showInFolder(record.path)
}

async function handleDeleteSelected() {
  const ids = Array.from(selectedIds.value)
  for (const id of ids) {
    try {
      await deleteRecord(id)
    } catch (err) {
      console.error('Failed to delete record:', err)
    }
  }
  selectedIds.value.clear()
  await loadRecords()
}

async function handleDeleteOne(id: string) {
  try {
    await deleteRecord(id)
    selectedIds.value.delete(id)
    await loadRecords()
  } catch (err) {
    console.error('Failed to delete record:', err)
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<template>
  <div class="records-view">
    <!-- 顶部工具栏 -->
    <div class="records-toolbar">
      <h2 class="records-title">
        <Film :size="20" />
        录制列表
        <span class="records-count">({{ records.length }})</span>
      </h2>
      <div class="toolbar-actions">
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <List :size="16" />
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <Grid3X3 :size="16" />
          </button>
        </div>
        <button
          v-if="selectedIds.size > 0"
          class="btn-delete-batch"
          @click="handleDeleteSelected"
        >
          <Trash2 :size="14" />
          删除选中 ({{ selectedIds.size }})
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="records-empty">
      <p class="empty-text">加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="records.length === 0" class="records-empty">
      <Film :size="48" class="empty-icon" />
      <p class="empty-text">暂无录制文件</p>
      <p class="empty-hint">点击"开始录制"创建您的第一个视频</p>
    </div>

    <!-- 列表视图 -->
    <div v-else-if="viewMode === 'list'" class="records-list">
      <!-- 表头 -->
      <div class="list-header">
        <button class="checkbox-btn" @click="toggleSelectAll">
          <CheckSquare v-if="allSelected" :size="16" />
          <Square v-else :size="16" />
        </button>
        <span class="col-name">文件名</span>
        <span class="col-date">日期</span>
        <span class="col-duration">时长</span>
        <span class="col-size">大小</span>
        <span class="col-format">格式</span>
        <span class="col-actions">操作</span>
      </div>

      <!-- 列表项 -->
      <div
        v-for="record in records"
        :key="record.id"
        class="list-item"
        :class="{ selected: isSelected(record.id) }"
      >
        <button class="checkbox-btn" @click="toggleSelect(record.id)">
          <CheckSquare v-if="isSelected(record.id)" :size="16" />
          <Square v-else :size="16" />
        </button>
        <span class="col-name" :title="record.name">{{ record.name }}</span>
        <span class="col-date">
          <Calendar :size="12" />
          {{ formatDate(record.createdAt) }}
        </span>
        <span class="col-duration">
          <Clock :size="12" />
          {{ formatDuration(record.duration) }}
        </span>
        <span class="col-size">
          <HardDrive :size="12" />
          {{ formatSize(record.size) }}
        </span>
        <span class="col-format">
          <FileType :size="12" />
          {{ getFormatFromName(record.name) }}
        </span>
        <div class="col-actions">
          <button class="action-btn play" title="播放" @click="handlePlay(record)">
            <Play :size="14" />
          </button>
          <button class="action-btn folder" title="打开所在文件夹" @click="handleShowInFolder(record)">
            <FolderOpen :size="14" />
          </button>
          <button class="action-btn delete" title="删除" @click="handleDeleteOne(record.id)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 方格视图 -->
    <div v-else class="records-grid">
      <div
        v-for="record in records"
        :key="record.id"
        class="grid-item"
        :class="{ selected: isSelected(record.id) }"
        @click="toggleSelect(record.id)"
      >
        <div class="grid-checkbox">
          <CheckSquare v-if="isSelected(record.id)" :size="16" />
          <Square v-else :size="16" />
        </div>
        <div class="grid-preview">
            <video
              v-if="record.path"
              :src="toMediaUrl(record.path)"
              preload="metadata"
              muted
              class="grid-preview-video"
            @loadedmetadata="onVideoMetadataLoaded"
          />
          <Film v-else :size="32" class="grid-preview-icon" />
        </div>
        <div class="grid-info">
          <span class="grid-name" :title="record.name">{{ record.name }}</span>
          <div class="grid-meta">
            <span><Clock :size="10" /> {{ formatDuration(record.duration) }}</span>
            <span><HardDrive :size="10" /> {{ formatSize(record.size) }}</span>
          </div>
          <div class="grid-meta">
            <span><Calendar :size="10" /> {{ formatDate(record.createdAt) }}</span>
            <span class="grid-format">{{ getFormatFromName(record.name) }}</span>
          </div>
        </div>
        <div class="grid-actions">
          <button class="action-btn play" title="播放" @click.stop="handlePlay(record)">
            <Play :size="14" />
          </button>
          <button class="action-btn folder" title="打开所在文件夹" @click.stop="handleShowInFolder(record)">
            <FolderOpen :size="14" />
          </button>
          <button class="action-btn delete" title="删除" @click.stop="handleDeleteOne(record.id)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  gap: 16px;
  overflow: hidden;
}

/* 顶部工具栏 */
.records-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.records-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.records-count {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  color: var(--text-primary);
  background: var(--glass-mid);
}

.view-btn.active {
  color: var(--accent);
  background: var(--bg-accent);
}

.btn-delete-batch {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-batch:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* 空状态 */
.records-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-icon {
  color: var(--accent);
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 列表视图 */
.records-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.list-header {
  display: grid;
  grid-template-columns: 32px 2fr 1.6fr 0.8fr 0.8fr 0.6fr 80px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.list-item {
  display: grid;
  grid-template-columns: 32px 2fr 1.6fr 0.8fr 0.8fr 0.6fr 80px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s;
  cursor: pointer;
}

.list-item:hover {
  background: var(--glass-low);
}

.list-item.selected {
  background: var(--bg-accent);
}

.checkbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.checkbox-btn:hover {
  color: var(--accent);
}

.col-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-date,
.col-duration,
.col-size,
.col-format {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
}

.col-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--glass-mid);
}

.action-btn.play:hover {
  color: var(--accent);
}

.action-btn.delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.action-btn.folder:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* 方格视图 */
.records-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding: 4px;
  align-content: start;
}

.grid-item {
  display: flex;
  flex-direction: column;
  background: var(--glass-low);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  height: fit-content;
}

.grid-item:hover {
  border-color: var(--glass-highlight);
}

.grid-item.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.grid-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  color: var(--text-muted);
}

.grid-preview {
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  position: relative;
}

.grid-preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-preview-icon {
  color: var(--accent);
  opacity: 0.5;
}

.grid-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.grid-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.grid-format {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-accent);
  color: var(--accent);
  font-weight: 600;
}

.grid-actions {
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  border-top: 1px solid var(--glass-border);
}
</style>
