export function isRangeValid(startDate, endDate) {
  return startDate < endDate;
}

export function calculateHours(entries) {
  let totalMinutes = 0;

  if (!entries || entries.length === 0) {
    return { hours: 0, minutes: 0 };
  }

  entries.forEach((entry) => {
    const startTime = new Date(`1970-01-01T${entry.startTime}:00`);
    const endTime = new Date(`1970-01-01T${entry.endTime}:00`);

    // Check if the time is valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error("Érvénytelen időpont: ", entry);
      return { hours: 0, minutes: 0 };
    }

    if (startTime >= endTime) {
      console.error(
        "A kezdési idő nem lehet nagyobb vagy egyenlő a befejező időnél:",
        entry
      );
      return { hours: 0, minutes: 0 };
    }

    const duration = (endTime - startTime) / (1000 * 60); // Duration in minutes
    totalMinutes += duration;
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60; // Remaining minutes on top of the hours

  // Check if the time is valid after the sum
  if (hours < 0 || minutes < 0) {
    return { hours: 0, minutes: 0 };
  }

  return { hours, minutes };
}
