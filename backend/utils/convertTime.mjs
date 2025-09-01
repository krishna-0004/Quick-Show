// utils/convertTime.mjs
export const combineDateTime = (dateStr, timeStr) => {
  // dateStr = '2025-09-09'
  // timeStr = '15:30'

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Month is 0-indexed in JS Date
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  return date;
};
