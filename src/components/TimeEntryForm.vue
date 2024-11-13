<template>
    <form @submit.prevent="handleSubmit" class="p-4 space-y-4 bg-gray-100 rounded-lg">
        <div>
            <label for="date" class="block font-medium">Dátum:</label>
            <input type="date" v-model="entry.date" required class="border rounded p-2 w-full" />
        </div>
        <div>
            <label for="start" class="block font-medium">Kezdés:</label>
            <input type="time" v-model="entry.startTime" required class="border rounded p-2 w-full" />
        </div>
        <div>
            <label for="end" class="block font-medium">Befejezés:</label>
            <input type="time" v-model="entry.endTime" required class="border rounded p-2 w-full" />
        </div>
        <div>
            <label for="description" class="block font-medium">Feladat leírása:</label>
            <textarea v-model="entry.description" rows="3" required class="border rounded p-2 w-full"></textarea>
        </div>
        <div>
            <label for="tags" class="block font-medium">Címkék:</label>
            <input type="text" v-model="entry.tags" placeholder="(pl. munka, fontos, stb.)" class="border rounded p-2 w-full" />
        </div>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded w-full">Mentés</button>
    </form>
</template>

<script>
import { addEntry } from '../db';
import { isRangeValid } from '../dateUtils';

export default {
    data() {
        return {
            entry: {
                date: '',
                startTime: '',
                endTime: '',
                description: '',
                tags: ''
            }
        };
    },
    methods: {
        async handleSubmit() {
            if (!isRangeValid(this.entry.startTime, this.entry.endTime)) {
                alert("A kezdési idő nem lehet később, mint a befejezési idő.");
                return;
            }
            try {
                await addEntry(this.entry);
                this.$emit('entry-added');
                alert('Bejegyzés sikeresen mentve');
                this.resetForm();
            } catch (error) {
                alert("Hiba történt az esemény mentésekor.");
            }
        },
        resetForm() {
            this.entry = { date: '', startTime: '', endTime: '', description: '', tags: '' };
        }
    }
};
</script>
