// Replace this provider with a server-backed Chelsea adapter when API access is available.
// Never put Chelsea credentials in browser code.
export const courts = [
  { id: 'court-1', name: 'Court 1' },
  { id: 'court-2', name: 'Court 2' },
  { id: 'court-3', name: 'Court 3' },
  { id: 'court-4', name: 'Court 4' },
];

export async function getAvailability(date) {
  const seed = Number(date.replaceAll('-', ''));
  const slots = [];
  for (let hour = 8; hour < 23; hour++) {
    for (const [index, court] of courts.entries()) {
      slots.push({
        id: `${date}-${court.id}-${hour}`,
        date, courtId: court.id, start: hour * 60, end: (hour + 1) * 60,
        available: (seed + hour * 7 + index * 3) % 5 > 1,
      });
    }
  }
  return { source: 'demo', slots };
}
