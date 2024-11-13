<template>
    <div class="p-4">
        <!-- Responsive Top Bar -->
        <div v-if="view !== 'today'" class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <!-- Navigation buttons (Left Arrow, Title, Right Arrow) -->
            <div class="flex gap-2 w-full flex-col sm:flex-row">
                <button @click="navigate(-1)" class="p-2 text-gray-600 w-full">&larr;</button>
                <button @click="navigate(-1, 'year')" class="p-2 text-gray-600 md:w-1 w-full">&laquo;</button>
                <h2 class="text-lg md:text-xl font-bold w-full text-nowrap text-center">{{ viewTitle }}</h2>
                <button @click="navigate(1, 'year')" class="p-2 text-gray-600 md:w-1 w-full">&raquo;</button>
                <button @click="navigate(1)" class="p-2 text-gray-600 w-full">&rarr;</button>
            </div>
            <div class="w-full flex justify-center">
                <button @click="resetToCurrent" class="p-2 text-gray-600">Ma</button>
            </div>
        </div>

        <!-- Calendar view -->
        <div v-if="view === 'week' || view === 'month'" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div v-for="(day, index) in calendarDays" :key="index" class="text-center p-2 border rounded cursor-pointer"
                :class="{
                    'bg-blue-500 text-white': day.date === selectedDay?.date,
                    'bg-white': day.date !== selectedDay?.date,
                    'text-gray-400 text-xs': day.isOutsideCurrentMonth
                }" @click="selectDay(day)">
                <p class="font-semibold text-sm md:text-base">{{ day.name }}</p>
                <p class="text-xs md:text-sm">{{ day.date }}</p>
                <div v-for="entry in day.entries" :key="entry.id"
                    class="text-xs md:text-sm text-gray-700 bg-orange-100 rounded-md">
                    <p class="m-1">{{ entry.description }}</p> <!-- Only name of event shown in the calendar -->
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div class="py-3" v-if="selectedDay && selectedDay.entries.length > 0">
            <statistics-calc :entries="selectedDay.entries" />
        </div>

        <!-- Notification Message -->
        <div v-if="notification" class="notification bg-green-200 text-green-800 p-2 mb-4 rounded">
            {{ notification }}
        </div>

        <div v-if="error" class="notification bg-red-200 text-red-800 p-2 mb-4 rounded">
            {{ error }}
        </div>

        <!-- Selected day events -->
        <div v-if="selectedDay && selectedDay.entries.length > 0" class="mt-6">
            <h3 class="text-lg md:text-xl font-semibold mb-4">{{ selectedDay.date }}, {{ selectedDay.name }}</h3>
            <div v-for="entry in selectedDay.entries" :key="entry.id" class="p-4 bg-white shadow rounded mb-4">
                <p><span class="font-semibold">{{ entry.description }}</span> </p>
                <p><span class="font-semibold">Kezdés:</span> {{ entry.startTime }}</p>
                <p><span class="font-semibold">Befejezés:</span> {{ entry.endTime }}</p>

                <!-- Tags -->
                <div v-if="entry.tags">
                    <p class="text-sm text-gray-500 mt-2">
                        <span v-for="(tag, index) in entry.tags.split(',')" :key="index"
                            class="bg-gray-200 p-1 rounded text-xs mr-1">{{ tag.trim() }}</span>
                    </p>
                </div>

                <!-- Edit and Delete buttons -->
                <button @click="editEntry(entry)" class="text-blue-500 block font-semibold mt-2">Szerkesztés</button>
                <button @click="confirmDelete(entry.id)" class="text-red-500 block font-semibold mt-2">Törlés</button>

                <!-- Edit Form -->
                <div v-if="editingEntry && editingEntry.id === entry.id" class="mt-4">
                    <form @submit.prevent="saveEdit(entry.id)">

                        <!-- Date Input -->
                        <div class="mb-4">
                            <label for="editDate" class="block text-sm">Dátum</label>
                            <input type="date" id="editDate" v-model="editingEntry.date"
                                class="w-full p-2 border rounded-md" />
                        </div>

                        <!-- Start Time Input -->
                        <div class="mb-4">
                            <label for="startTime" class="block text-sm">Kezdési idő</label>
                            <input type="time" id="startTime" v-model="editingEntry.startTime"
                                class="w-full p-2 border rounded-md" />
                        </div>

                        <!-- End Time Input -->
                        <div class="mb-4">
                            <label for="endTime" class="block text-sm">Befejezési idő</label>
                            <input type="time" id="endTime" v-model="editingEntry.endTime"
                                class="w-full p-2 border rounded-md" />
                        </div>

                        <!-- Description Input -->
                        <div class="mb-4">
                            <label for="description" class="block text-sm">Leírás</label>
                            <textarea id="description" v-model="editingEntry.description"
                                class="w-full p-2 border rounded-md"
                                placeholder="Írja be az esemény leírását"></textarea>
                        </div>

                        <!-- Tags Edit Input -->
                        <div class="mb-4">
                            <label for="tags" class="block text-sm">Címkék</label>
                            <input type="text" id="tags" v-model="editingEntry.tags"
                                class="w-full p-2 border rounded-md" placeholder="(pl. munka, fontos, stb.)" />
                        </div>


                        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-md">Mentés</button>
                        <button @click="cancelEdit" type="button" class="ml-2 text-gray-500">Mégsem</button>
                    </form>
                </div>
            </div>
        </div>

        <div v-if="selectedDay && selectedDay.entries.length === 0" class="mt-6 text-gray-500">
            <p>Nincsenek események ezen a napon.</p>
        </div>

    </div>
</template>

<script>
import { deleteEntry, updateEntry } from '../db';
import { isRangeValid } from '../dateUtils';
import StatisticsCalc from './StatisticsCalc.vue';

export default {
    props: ['view', 'entries'],
    components: {
        StatisticsCalc
    },
    data() {
        return {
            selectedDay: null,
            calendarDays: [],
            loading: true,
            currentDate: new Date(),
            viewTitle: '',
            isEditing: false,
            editingEntry: null,
            notification: '',
            error: ''
        };
    },
    watch: {
        async view(newValue) {
            if (['week', 'month'].includes(newValue)) {
                await this.updateCalendarDays(newValue);
                this.updateViewTitle();
            }
            this.resetToCurrent();
            this.selectToday();
        },
        entries: {
            async handler() {
                await this.updateCalendarDays(this.view);
                this.selectToday();
            },
            immediate: true,
            deep: true,
        }
    },
    methods: {
        showNotification(message) {
            this.notification = message;
            setTimeout(() => (this.notification = ''), 3000);
        },

        showError(message) {
            this.error = message;
            setTimeout(() => (this.error = ''), 3000);
        },

        confirmDelete(id) {
            if (window.confirm("Biztosan törölni szeretné ezt az eseményt?")) {
                this.deleteEntry(id);
            }
        },

        async deleteEntry(id) {
            try {
                await deleteEntry(id);
                this.$emit('entry-deleted');
                this.showNotification("Esemény sikeresen törölve.");
            } catch (error) {
                this.showError("Hiba történt az esemény törlésekor.");
                console.error("Error deleting entry:", error);
            }
        },

        selectDay(day) {
            this.selectedDay = day;
            this.isEditing = false; // Reset editing mode when a new day is selected
        },
        navigate(direction, unit) {
            if (this.view === 'week') {
                if (unit === 'year') {
                    this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
                } else {
                    this.currentDate.setDate(this.currentDate.getDate() + direction * 7); // Move by weeks
                }
            } else if (this.view === 'month') {
                if (unit === 'year') {
                    this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
                } else {
                    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                }
            }
            this.updateCalendarDays(this.view);
            this.updateViewTitle();
        },
        resetToCurrent() {
            this.currentDate = new Date();
            this.updateCalendarDays(this.view);
            this.selectToday();
            this.updateViewTitle();
        },
        getViewRange() {
            const start = new Date(this.currentDate);
            const end = new Date(this.currentDate);

            if (this.view === 'week') {
                start.setDate(this.currentDate.getDate() - ((this.currentDate.getDay() + 6) % 7)); // Start from Monday of the current week
                end.setDate(start.getDate() + 6);
            } else if (this.view === 'month') {
                start.setDate(1);
                end.setDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate()); // Last day of the month
            }

            return [start, end];
        },
        async updateCalendarDays(view) {
            const daysCount = view === 'week' ? 7 : 42; // 7 days for week view, 42 days for month view to show all possible days
            const startDate = new Date(this.currentDate);

            if (view === 'week') {
                startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7)); // Start from Monday of the current week
            } else {
                startDate.setDate(1);
                const dayOfWeek = (startDate.getDay() + 6) % 7; // Day of the week for the first day of the month
                startDate.setDate(startDate.getDate() - dayOfWeek);
            }

            this.calendarDays = Array.from({ length: daysCount }, (_, i) => {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + i);

                // Sort entries by start date, end date, and name
                const sortedEntries = this.entries
                    .filter(entry => entry.date === day.toISOString().split('T')[0]) // split to get only the date part 
                    .sort((a, b) => {
                        const startComparison = a.startTime.localeCompare(b.startTime);
                        if (startComparison !== 0) return startComparison;

                        const endComparison = a.endTime.localeCompare(b.endTime);
                        if (endComparison !== 0) return endComparison;

                        return a.description.localeCompare(b.description);
                    });

                return {
                    name: this.getDayName(day),
                    date: day.toISOString().split('T')[0],
                    entries: sortedEntries,
                    isOutsideCurrentMonth: day.getMonth() !== this.currentDate.getMonth(),
                };
            });
        },
        getDayName(date) {
            const daysOfWeek = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
            return daysOfWeek[(date.getDay() + 6) % 7];
        },
        selectToday() {
            const todayDate = new Date().toISOString().split('T')[0];
            const todayDay = this.calendarDays.find(day => day.date === todayDate);
            if (todayDay) this.selectDay(todayDay);
        },
        updateViewTitle() {
            const [startDate, endDate] = this.getViewRange();

            if (this.view === 'week') {
                this.viewTitle = this.formatWeekTitle(startDate, endDate);
            } else {
                // Monthly view
                this.viewTitle = this.currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' });
            }
        },
        formatWeekTitle(startDate, endDate) {
            const startMonth = startDate.getMonth();
            const endMonth = endDate.getMonth();
            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();

            if (startMonth === endMonth && startYear === endYear) {
                return `${startDate.toLocaleString('hu-HU', { month: 'long' })} ${startDate.getDate()} - ${endDate.getDate()}.`;
            }

            if (startYear === endYear) {
                return `${startDate.toLocaleString('hu-HU', { month: 'long' })} ${startDate.getDate()} - ${endDate.toLocaleString('hu-HU', { month: 'long' })} ${endDate.getDate()}.`;
            }

            return `${startDate.toLocaleString('hu-HU', { year: 'numeric', month: 'long' })} ${startDate.getDate()} - ${endDate.toLocaleString('hu-HU', { year: 'numeric', month: 'long' })} ${endDate.getDate()}.`;
        },

        editEntry(entry) {
            this.isEditing = true;
            this.editingEntry = { ...entry }; // Clone the entry to avoid directly mutating the original
        },

        cancelEdit() {
            this.isEditing = false;
            this.editingEntry = null; // Clear editingEntry when canceling
        },

        async saveEdit() {
            if (!this.editingEntry.startTime || !this.editingEntry.endTime) {
                alert("Kérjük, adjon meg kezdési és befejezési időpontot.");
                return;
            }

            // Ensure start time is before end time
            if (!isRangeValid(this.editingEntry.startTime, this.editingEntry.endTime)) {
                this.showError("A kezdési idő nem lehet később, mint a befejezési idő.");
                return;
            }

            try {
                await updateEntry(this.editingEntry);

                // Find the selected entry and update it
                const day = this.selectedDay.entries.find(day => day.id === this.editingEntry.id);
                Object.assign(day, this.editingEntry); // Update the selected day's entry

                this.isEditing = false;
                this.editingEntry = null; // Reset editing state after saving
                this.showNotification("Változtatások mentve.");
            } catch (error) {
                this.showError("Hiba történt a változtatások mentésekor.");
                console.error("Error saving entry:", error);
            }
        },

        // Update the formatted start date when user inputs a new date
        updateStartDate() {
            const [day, month, year] = this.formattedStartDate.split('/');
            if (day && month && year) {
                this.editingEntry.startTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${this.editingEntry.startTime.split('T')[1]}`;
            }
        },

        // Update the formatted end date when user inputs a new date
        updateEndDate() {
            const [day, month, year] = this.formattedEndDate.split('/');
            if (day && month && year) {
                this.editingEntry.endTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${this.editingEntry.endTime.split('T')[1]}`;
            }
        },

        // Convert startTime to dd/mm/yyyy format
        getFormattedStartDate() {
            const date = new Date(this.editingEntry.startTime);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        },

        // Convert endTime to dd/mm/yyyy format
        getFormattedEndDate() {
            const date = new Date(this.editingEntry.endTime);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
    },
    async created() {
        await this.updateCalendarDays(this.view);
        this.updateViewTitle();
        this.selectToday();
    },

    computed: {
        // Computed property to show formatted start date
        formattedStartDate: {
            get() {
                return this.getFormattedStartDate();
            },
            set() {
                this.updateStartDate();
            }
        },

        // Computed property to show formatted end date
        formattedEndDate: {
            get() {
                return this.getFormattedEndDate();
            },
            set() {
                this.updateEndDate();
            }
        }
    }
};
</script>


<style scoped>
.notification {
    animation: fadeIn 0.5s ease, fadeOut 0.5s ease 2.5s;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}
</style>