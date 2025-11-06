<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Grid, CloseBold } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();

/* 左側選項 */
const dateOptions = ['前30分', '今日', '自訂'];
const selectedDate = ref('前30分');
const customStartDate = ref('');
const customEndDate = ref('');
const orderNumber = ref('');
const timeZones = ['美東時區', '北京時區'];
const selectedTimeZone = ref('美東時區');
const isMenuOpen = ref(false);
const selectAndClose = (fn: () => void) => {
  fn();
  isMenuOpen.value = false;
};

const today = dayjs();
const startDate = today.subtract(7, 'day');

// 可能的年份
const yearOptions = [today.year()];

// 月份（可能跨月）
const monthOptions = Array.from(
  new Set([startDate.month() + 1, today.month() + 1])
).sort((a, b) => a - b);

// reactive 選項
const fromYear = ref(today.year());
const fromMonth = ref(monthOptions[0]);
const fromDay = ref<number>();

const toYear = ref(today.year());
const toMonth = ref(today.month() + 1);
const toDay = ref(today.date());

// 計算「從」日期的日選項
const dayOptions = computed(() => {
  return getDaysForMonth(fromMonth.value ?? today.month() + 1);
});

// 根據月份計算允許的日期
function getDaysForMonth(month: number): number[] {
  if (month === startDate.month() + 1) {
    return [startDate.date()]; // 例如 [31]
  } else if (month === today.month() + 1) {
    return Array.from({ length: today.date() }, (_, i) => i + 1);
  }
  return [];
}

/* 右側表格控制 */
const statusOptions = ['默認', '中獎', '未中獎'];
const selectedStatus = ref('默認');
const rowOptions = [10, 20, 50, 100];
const selectedRows = ref(10);

/* 範例表格資料 */
const tableData = ref([
  {
    game: '上山打老虎1',
    time: '2025/10/28 04:56:30',
    free_game: true,
    order: '26740305',
    profit: 2316,
    status: '默認',
    link: '>',
  },
  {
    game: 'JACK IN THE DONUTS',
    time: '2025/10/28 04:40:12',
    free_game: false,
    order: '26740300',
    profit: -500.01,
    status: '未中獎',
    link: '>',
  },
  {
    game: 'Garena 傳說對決',
    time: '2025/10/28 05:10:00',
    free_game: true,
    order: '26740310',
    profit: 1200.18,
    status: '中獎',
    link: '>',
  },
]);

/* 日期過濾函式 */
const filterByDate = (rowTime: string) => {
  const rowDate = new Date(rowTime);
  const now = new Date();

  if (selectedDate.value === '前30分') {
    return (now.getTime() - rowDate.getTime()) / 60000 <= 30;
  } else if (selectedDate.value === '今日') {
    return rowDate.toDateString() === now.toDateString();
  } else if (
    selectedDate.value === '自訂' &&
    customStartDate.value &&
    customEndDate.value
  ) {
    const start = new Date(customStartDate.value);
    const end = new Date(customEndDate.value);
    return rowDate >= start && rowDate <= end;
  }
  return true;
};

const pagedData = computed(() =>
  filteredData.value.slice(0, selectedRows.value)
);

/* 動態過濾表格 */
const filteredData = computed(() =>
  tableData.value
    .filter(row => filterByDate(row.time))
    .filter(row =>
      orderNumber.value ? row.order.includes(orderNumber.value) : true
    )
    .filter(row =>
      selectedStatus.value === '默認'
        ? true
        : row.status === selectedStatus.value
    )
);

const profitColor = (value: number) => {
  return value >= 0 ? 'text-[#01ba80]' : 'text-[#eb4b1c]';
};

watch(isMenuOpen, val => {
  document.body.style.overflow = val ? 'hidden' : 'auto';
});

watch(locale, newLang => {
  localStorage.setItem('lang', newLang);
});

const saveLang = () => {
  localStorage.setItem('lang', locale.value);
};
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen bg-gray-500">
    <!-- 手機版上方 -->
    <div
      class="md:hidden flex items-center justify-start bg-[#2f313d] text-white p-4"
    >
      <!-- 漢堡按鈕在左上角 -->
      <button
        @click="isMenuOpen = !isMenuOpen"
        class="flex items-center justify-center focus:outline-none mr-3"
      >
        <el-icon :size="24"><Grid /></el-icon>
      </button>
      <h1 class="text-lg font-semibold">報表查詢</h1>
    </div>

    <!-- 桌面版永遠顯示 -->
    <aside
      class="hidden md:flex md:flex-col md:w-64 bg-[#2f313d] text-white justify-between p-8"
    >
      <div>
        <h1 class="text-2xl text-center font-semibold mb-10 leading-normal">
          報表查詢
        </h1>
        <h2 class="text-lg font-semibold mb-2">日期搜索</h2>
        <div class="flex flex-col space-y-2 mb-4">
          <button
            v-for="option in dateOptions"
            :key="option"
            :class="[
              'py-2 rounded cursor-pointer',
              selectedDate === option
                ? 'bg-[#f5c000] text-[#242830]'
                : 'bg-transparent border border-[#3e434f]',
            ]"
            @click="selectAndClose(() => (selectedDate = option))"
          >
            {{ option }}
          </button>
        </div>

        <div
          v-if="selectedDate === '自訂'"
          class="flex flex-col space-y-2 mb-6"
        >
          <input
            type="date"
            v-model="customStartDate"
            class="border rounded px-2 py-1"
          />
          <input
            type="date"
            v-model="customEndDate"
            class="border rounded px-2 py-1"
          />
        </div>

        <h2 class="text-lg font-semibold mb-2">单号搜索 (7天内)</h2>
        <div class="flex flex-col space-y-2 mb-6">
          <input
            type="text"
            v-model="orderNumber"
            placeholder="输入单号"
            class="border border-[#3e434f] rounded px-2 py-1"
          />
          <button
            class="bg-[#f5c000] text-[#242830] py-2 rounded disabled:bg-[#484c5c] disabled:text-[#888d9e] cursor-pointer"
            @click="selectAndClose(() => {})"
          >
            搜索
          </button>
        </div>
      </div>
    </aside>

    <!-- 手機版用 clip 動畫控制 -->
    <aside
      class="fixed md:hidden top-0 left-0 w-full h-full bg-[#2f313d] text-white flex flex-col justify-between p-8 z-40 transition-all duration-500 ease-in-out"
      :class="isMenuOpen ? 'clip-open' : 'clip-closed'"
    >
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">日期搜索</h2>
          <el-icon :size="24" @click="isMenuOpen = false">
            <CloseBold />
          </el-icon>
        </div>
        <div class="flex flex-col space-y-2 mb-4">
          <button
            v-for="option in dateOptions"
            :key="option"
            :class="[
              'py-2 rounded cursor-pointer',
              selectedDate === option
                ? 'bg-[#f5c000] text-[#242830]'
                : 'bg-transparent border border-[#3e434f]',
            ]"
            @click="selectAndClose(() => (selectedDate = option))"
          >
            {{ option }}
          </button>
        </div>

        <template v-if="selectedDate === '自訂'">
          <div class="mb-4 flex flex-wrap gap-3 items-center">
            <div class="flex flex-1 gap-x-2">
              <span class="font-semibold mr-2">從</span>
              <div class="flex flex-1 items-center justify-between gap-x-4">
                <el-select
                  class="w-full"
                  v-model="fromYear"
                  placeholder="年"
                  :disabled="yearOptions.length === 1"
                >
                  <el-option
                    v-for="y in yearOptions"
                    :key="y"
                    :label="y"
                    :value="y"
                  />
                </el-select>

                <el-select
                  class="w-full"
                  v-model="fromMonth"
                  placeholder="月"
                  :disabled="monthOptions.length === 1"
                >
                  <el-option
                    v-for="m in monthOptions"
                    :key="m"
                    :label="m"
                    :value="m"
                  />
                </el-select>

                <el-select class="w-full" v-model="fromDay" placeholder="日">
                  <el-option
                    v-for="d in dayOptions"
                    :key="d"
                    :label="d"
                    :value="d"
                  />
                </el-select>
              </div>
            </div>
            <div class="flex flex-1 gap-x-2">
              <span class="font-semibold mr-2">到</span>
              <div class="flex flex-1 items-center justify-between gap-x-4">
                <el-select
                  class="w-full"
                  v-model="toYear"
                  placeholder="年"
                  :disabled="yearOptions.length === 1"
                >
                  <el-option
                    v-for="y in yearOptions"
                    :key="y"
                    :label="y"
                    :value="y"
                  />
                </el-select>

                <el-select
                  class="w-full"
                  v-model="toMonth"
                  placeholder="月"
                  :disabled="monthOptions.length === 1"
                >
                  <el-option
                    v-for="m in monthOptions"
                    :key="m"
                    :label="m"
                    :value="m"
                  />
                </el-select>

                <el-select class="w-full" v-model="toDay" placeholder="日">
                  <el-option
                    v-for="d in getDaysForMonth(toMonth)"
                    :key="d"
                    :label="d"
                    :value="d"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </template>

        <h2 class="text-lg font-semibold mb-2">单号搜索 (7天内)</h2>
        <div class="flex flex-col space-y-2 mb-6">
          <input
            type="text"
            v-model="orderNumber"
            placeholder="输入单号"
            class="border border-[#3e434f] rounded px-2 py-1"
          />
          <button
            class="bg-[#f5c000] text-[#242830] py-2 rounded disabled:bg-[#484c5c] disabled:text-[#888d9e] cursor-pointer"
            @click="selectAndClose(() => {})"
          >
            搜索
          </button>
        </div>

        <div class="mb-5">
          <select v-model="locale" @change="saveLang">
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="fr">Français</option>
          </select>

          <h1>{{ t('hello') }}</h1>
          <button>{{ t('start_game') }}</button>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-2">時區選擇</h2>
        <select
          v-model="selectedTimeZone"
          class="bg-[#484c5c] w-full border rounded px-2 py-1 cursor-pointer"
          @change="selectAndClose(() => {})"
        >
          <option v-for="tz in timeZones" :key="tz">{{ tz }}</option>
        </select>
      </div>
    </aside>

    <!-- 遮罩背景 -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
      @click="isMenuOpen = false"
    ></div>

    <!-- 右側內容 -->
    <main class="flex-1 p-4 md:p-6 overflow-x-auto bg-[#242830]">
      <section
        class="mb-4 p-4 bg-[#30323e] text-white rounded text-lg font-semibold"
      >
        {{ selectedTimeZone }}：{{ selectedDate }}
      </section>
      <section class="mb-4 flex items-center justify-between gap-2">
        <!-- 按鈕群組 -->
        <div
          class="flex flex-nowrap border border-[#626676] rounded overflow-hidden max-w-max"
        >
          <button
            v-for="(s, idx) in statusOptions"
            :key="s"
            @click="selectedStatus = s"
            :class="[
              'px-3 py-1 text-sm transition focus:outline-none cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center',
              selectedStatus === s
                ? 'bg-[#f5c000] text-[#242830]'
                : 'bg-[#484c5c] text-white hover:bg-gray-600',
              idx !== statusOptions.length - 1
                ? 'border-r border-[#626676]'
                : '',
            ]"
          >
            {{ s }}
          </button>
        </div>

        <!-- 下拉選單 -->
        <div class="w-auto">
          <select
            v-model="selectedRows"
            class="w-auto bg-[#484c5c] border-none rounded px-2 py-1 text-white focus:outline-none focus:ring-0 cursor-pointer text-sm"
          >
            <option v-for="r in rowOptions" :key="r" :value="r">
              {{ r }}筆
            </option>
          </select>
        </div>
      </section>

      <section class="overflow-x-auto text-white bg-[#30323e] rounded">
        <table class="min-w-full text-left border-collapse">
          <tbody>
            <tr
              v-for="(row, idx) in pagedData"
              :key="row.order"
              :class="[
                'hover:bg-gray-800',
                idx !== pagedData.length - 1 ? 'border-b border-gray-600' : '',
              ]"
            >
              <td class="px-8 py-6 text-nowrap">{{ row.game }}</td>
              <td class="px-8 py-6 text-[14px] text-[rgb(136,141,159)]">
                {{ row.time }}
              </td>
              <td class="px-8 py-6">
                <template v-if="row.free_game">
                  <span
                    class="p-[6px_10px] bg-[#4c63ff] text-[12px] sm:text-[13px] text-nowrap rounded-[3px]"
                  >
                    免費遊戲
                  </span>
                </template>
              </td>
              <td class="px-4 text-end">{{ row.order }}</td>
              <td
                class="px-4 text-end font-medium"
                :class="profitColor(row.profit)"
              >
                {{
                  row.profit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
              </td>
              <td class="px-[6px_36px] text-end cursor-pointer">
                {{ row.link }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* 自訂圓弧展開動畫 */
.clip-closed {
  clip-path: circle(0% at 0 0);
}
.clip-open {
  clip-path: circle(150% at 0 0);
}
</style>
