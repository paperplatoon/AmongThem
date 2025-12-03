// Time format: "HH:MM" (24-hour format)

// Exported utilities for shared use
export const formatTime = (hours, minutes) => {
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const timeToMinutes = (timeString) => {
  const { hours, minutes } = parseTime(timeString);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
};

const isTimeInWindow = (time, windowStart, windowEnd) => {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(windowStart);
  const endMin = timeToMinutes(windowEnd);

  // Handle window that wraps around midnight
  if (endMin < startMin) {
    return timeMin >= startMin || timeMin <= endMin;
  }

  return timeMin >= startMin && timeMin <= endMin;
};

export const generateTimeOfDeath = () => {
  // Random time between 03:00 and 22:59
  const minMinutes = 3 * 60; // 03:00
  const maxMinutes = 22 * 60 + 59; // 22:59
  const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  return minutesToTime(randomMinutes);
};

export const generateAll8HourWindows = () => {
  const windows = [];
  for (let startHour = 0; startHour < 24; startHour++) {
    const start = formatTime(startHour, 0);
    const endHour = (startHour + 8) % 24;
    const end = formatTime(endHour, 0);
    windows.push({ start, end });
  }
  return windows;
};

export const generateAll4HourWindows = () => {
  const windows = [];
  for (let startHour = 0; startHour < 24; startHour++) {
    const start = formatTime(startHour, 0);
    const endHour = (startHour + 4) % 24;
    const end = formatTime(endHour, 0);
    windows.push({ start, end });
  }
  return windows;
};

export const findRandomWindowContaining = (time, windows) => {
  const validWindows = windows.filter((window) =>
    isTimeInWindow(time, window.start, window.end)
  );

  if (validWindows.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * validWindows.length);
  const selected = validWindows[randomIndex];

  return `${selected.start}-${selected.end}`;
};

export const calculateTimeWindow8h = (timeOfDeath) => {
  const windows = generateAll8HourWindows();
  return findRandomWindowContaining(timeOfDeath, windows);
};

export const calculateTimeWindow4h = (timeOfDeath) => {
  const windows = generateAll4HourWindows();
  return findRandomWindowContaining(timeOfDeath, windows);
};
