<template>
    <div class="bg-gray-100 p-4 rounded-lg">
        <h2 class="text-md font-bold">Napi munkaidő:</h2>
        <p class="text-blue-700 text-lg font-semibold inline ">
            {{ totalHours.hours }} óra
            <span v-if="totalHours.minutes > 0"> {{ totalHours.minutes }} perc</span>
        </p>
    </div>
</template>

<script>
import { calculateHours } from '../dateUtils';

export default {
    props: ['entries'],
    computed: {
        totalHours() {
            return calculateHours(this.entries);
        }
    }
};
</script>
