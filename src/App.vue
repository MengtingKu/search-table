<script lang="ts" setup>
import { ref, computed } from 'vue';

/* 左側選項 */
const dateOptions = ['前30分', '今日', '自訂'];
const selectedDate = ref('前30分');
const customStartDate = ref('');
const customEndDate = ref('');
const orderNumber = ref('');
const timeZones = ['美東時區', '北京時區'];
const selectedTimeZone = ref('美東時區');

/* 右側表格控制 */
const statusOptions = ['默認', '中獎', '未中獎'];
const selectedStatus = ref('默認');
const rowOptions = [10, 20, 50, 100];
const selectedRows = ref(10);

/* 範例表格資料 */
const tableData = ref([
  {
    game: '跳起来2',
    time: '2025/10/26 04:56:30',
    free_game: true,
    order: '26740305',
    profit: 2316,
    status: '默認',
    link: '>',
  },
  {
    game: '跳起来1',
    time: '2025/10/26 04:40:12',
    free_game: false,
    order: '26740300',
    profit: -500.01,
    status: '未中獎',
    link: '>',
  },
  {
    game: '跳起来3',
    time: '2025/10/26 05:10:00',
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
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen bg-gray-100">
    <!-- 左側欄 -->
    <aside
      class="w-full md:w-64 p-8 bg-[#2f313d] text-white flex flex-col justify-between"
    >
      <div>
        <h2 class="text-lg font-semibold mb-2">日期搜索</h2>
        <div class="flex flex-col space-y-2 mb-4">
          <button
            v-for="option in dateOptions"
            :key="option"
            :class="
              selectedDate === option
                ? 'bg-[#f5c000] text-[#242830]'
                : 'bg-transparent border border-[#3e434f]'
            "
            class="py-2 rounded cursor-pointer"
            @click="selectedDate = option"
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
          >
            搜索
          </button>
        </div>
      </div>
      <div>
        <h2 class="text-lg font-semibold mb-2">時區選擇</h2>
        <select
          v-model="selectedTimeZone"
          class="bg-[#484c5c] w-full border rounded px-2 py-1 cursor-pointer"
        >
          <option v-for="tz in timeZones" :key="tz">{{ tz }}</option>
        </select>
      </div>
    </aside>

    <!-- 右側內容 -->
    <main class="flex-1 p-4 md:p-6 overflow-x-auto bg-[#242830]">
      <section
        class="mb-4 p-4 bg-[#30323e] text-white rounded text-lg font-semibold"
      >
        {{ selectedTimeZone }}：{{ selectedDate }}
      </section>

      <section
        class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0"
      >
        <div
          class="inline-flex border border-[#626676] rounded overflow-hidden"
        >
          <button
            v-for="(s, idx) in statusOptions"
            :key="s"
            @click="selectedStatus = s"
            :class="[
              'px-3 py-1 transition focus:outline-none cursor-pointer',
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

        <select
          v-model="selectedRows"
          class="bg-[#484c5c] border-none rounded px-2 py-1 text-white focus:outline-none focus:ring-0 cursor-pointer"
        >
          <option v-for="r in rowOptions" :key="r" :value="r">{{ r }}筆</option>
        </select>
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
