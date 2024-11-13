<template>
  <div class="max-w-4xl mx-auto p-4 space-y-6">
    <h1 class="text-2xl font-bold text-center">Manag'em!</h1>

    <button @click="toggleAddEntryForm"
      class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mb-4 mx-auto">
      + Új esemény hozzáadása
    </button>

    <time-entry-form v-if="showAddForm" @entry-added="refreshEntries" />

    <div class="flex justify-center space-x-4">
      <button @click="setView('today')" :class="viewClass('today')">Ma</button>
      <button @click="setView('week')" :class="viewClass('week')">Heti</button>
      <button @click="setView('month')" :class="viewClass('month')">Havi</button>
    </div>

    <time-entry-list :view="currentView" :entries="entries" @entry-deleted="refreshEntries" />

  </div>
</template>

<script>
import TimeEntryForm from './components/TimeEntryForm.vue';
import TimeEntryList from './components/TimeEntryList.vue';
import { getEntries } from './db';

export default {
  components: { TimeEntryForm, TimeEntryList },
  data() {
    return {
      currentView: 'today',
      entries: [],
      showAddForm: false
    };
  },
  async created() {
    await this.refreshEntries();
  },
  methods: {
    async refreshEntries() {
      this.entries = await getEntries();
    },
    toggleAddEntryForm() {
      this.showAddForm = !this.showAddForm;
    },
    setView(view) {
      this.currentView = view;
    },
    viewClass(view) {
      return this.currentView === view // highlight the current view
        ? 'text-blue-700 border-b-2 border-blue-500 px-4 py-2'
        : 'text-gray-500 hover:text-blue-700 px-4 py-2';
    }
  }
};
</script>
