<script setup lang="ts">
import { compressFile } from '@/functions/imageCompression';
import { compressToZip } from '@/functions/zipCompression';
import { useI18n } from '@/hooks/useI18n';
import { useFileDataStore } from '@/stores/fileData';
import type { FileObj } from '@/types/file';
import { storeToRefs } from 'pinia';
import { ref, computed, watchEffect, watch } from 'vue';

const { t } = useI18n();

const fileDataStore = useFileDataStore();
const { files } = storeToRefs(fileDataStore);

const getUncompressedFiles = (fileObj: FileObj) => !fileObj.isCompressed && ['image', 'video'].includes(fileObj.file.type.split('/')[0]);

const isCompressing = ref(false);
const zipData = ref('');
const isZipCompressing = ref(false);
const uncompressedFiles = computed(() => files.value.filter(getUncompressedFiles));
const anyUncompressed = computed(() => Boolean(uncompressedFiles.value.length));
const toCompress = ref<FileObj[]>([]);

// limit to 6 concurrent workers in order to work around a bug in Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1885198
const workerLimit = 6;
const availableThreads = Math.max(navigator.hardwareConcurrency - 2, 1);
const workerThreadAmount = Math.min(workerLimit, availableThreads);

async function editFileObj(fileObj: FileObj) {
  try {
    const compressedFile = await compressFile(fileObj.file, fileObj);
    fileObj.file = compressedFile;
    fileObj.isCompressed = true;
    fileObj.isError = false;
  } catch (error) {
    fileObj.isError = true;
  }
}

// add files to toCompress array when a thread is available
watchEffect(() => {
  if (isCompressing.value) {
    const amountToPush = workerThreadAmount - toCompress.value.filter(getUncompressedFiles).length;
    const pool = uncompressedFiles.value.filter((item) => !toCompress.value.includes(item)).slice(0, amountToPush);
    if (pool.length) toCompress.value = [...toCompress.value, ...pool];
  }
});

// compress new files that are added to the toCompress array
watch(toCompress, (newVal, oldVal) => {
  const filesToCompress = newVal.filter((item) => !oldVal.includes(item));
  filesToCompress.forEach(editFileObj);
});

// set isCompressing to false when compression finished
watchEffect(() => {
  if (!uncompressedFiles.value.length && isCompressing.value) {
    isCompressing.value = false;
    toCompress.value = [];
  }
});

// zip files when everything is compressed
watch(isCompressing, async (newVal, oldVal) => {
  if (oldVal && !newVal) {
    URL.revokeObjectURL(zipData.value);
    isZipCompressing.value = true;
    zipData.value = await compressToZip();
    isZipCompressing.value = false;
  }
});

// initiate compression
const compressFiles = () => (isCompressing.value = true);
</script>

<template>
  <div class="buttons">
    <button
      :aria-busy="isCompressing"
      :class="{ 'is-success': files.length && !anyUncompressed }"
      :disabled="!files.length || !anyUncompressed || isCompressing"
      @click="compressFiles"
    >
      {{ files.length && !anyUncompressed ? t('translation.allcompressed') : t('translation.compress') }}
    </button>
    <a
      :aria-busy="isZipCompressing"
      :disabled="!zipData || undefined"
      :href="zipData || undefined"
      role="button"
      download
    >
      {{ t('translation.downloadzip') }}
    </a>
    <button
      :disabled="!files.length"
      class="secondary"
      @click="files = []"
    >
      {{ t('translation.clearlist') }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.is-success {
  background-color: mediumseagreen;
  border: 1px solid darkseagreen;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-block-end: 1rem;

  & > * {
    flex-grow: 1;
    width: fit-content;
    height: fit-content;
    margin: 0;
  }
}
</style>
