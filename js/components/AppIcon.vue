<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>

<script>
const icons = {
  book: [
    'M5 3h15v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z',
    'M3 17a3 3 0 0 1 3-3h14',
    'M8 3v11',
    'M13 8h3',
  ],
  grid: ['M3 3h7v7H3Z', 'M14 3h7v7h-7Z', 'M3 14h7v7H3Z', 'M14 14h7v7h-7Z'],
  settings: ['M4 7h16', 'M4 17h16', 'M8 4v6', 'M16 14v6'],
  shield: [
    'M12 3 3.5 6v6c0 5 8.5 9 8.5 9s8.5-4 8.5-9V6Z',
    'm8.5 12 2.5 2.5 4.5-5',
  ],
  logout: ['M9 21H4V3h5', 'M9 12h12', 'm17 8 4 4-4 4'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'm15 15 6 6'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  arrow: ['M5 12h14', 'm14 7 5 5-5 5'],
  external: ['M14 3h7v7', 'm10 14 11-11', 'M10 3H3v18h18v-7'],
  check: ['m5 12 4 4L19 6'],
  alert: ['M12 3 1.5 21h21Z', 'M12 9v5', 'M12 17h.01'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 7v5l3 2'],
  wallet: ['M3 6h17v15H3Z', 'M3 6V3h14v3', 'M15 11h6v5h-6Z'],
  edit: ['m15 4 5 5', 'M3 21l1-6L17 2l5 5L9 20Z'],
  trash: ['M3 6h18', 'M9 6V3h6v3', 'm5 6 1 15h12l1-15', 'M10 10v7', 'M14 10v7'],
  copy: ['M9 9h12v12H9Z', 'M5 15H3V3h12v2'],
  lock: ['M5 10h14v11H5Z', 'M8 10V7a4 4 0 0 1 8 0v3'],
  mail: ['M3 5h18v14H3Z', 'm3 5 9 7 9-7'],
  chevron: ['m9 5 7 7-7 7'],
  refresh: ['M20 7a9 9 0 1 0 1 9', 'M20 2v6h-6'],
};

export default {
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 20 },
  },
  computed: {
    paths() {
      return icons[this.name] ?? icons.book;
    },
  },
};
</script>
