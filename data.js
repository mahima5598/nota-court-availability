// Replace this provider with a server-backed Chelsea adapter when API access is available.
// Never put Chelsea credentials in browser code.
export const locations = [
  { id: 'north', name: 'North Bubble', firstCourt: 1, courtCount: 4 },
  { id: 'south', name: 'South Bubble', firstCourt: 5, courtCount: 6 },
  { id: 'east', name: 'East Bubble', firstCourt: 11, courtCount: 4 },
];

export const courts = locations.flatMap((location) =>
  Array.from({ length: location.courtCount }, (_, index) => ({
    id: `${location.id}-court-${location.firstCourt + index}`,
    name: `Court ${location.firstCourt + index}`,
    locationId: location.id,
    locationName: location.name,
  })));

export async function getAvailability(date) {
  const seed = Number(date.replaceAll('-', ''));
  const slots = [];
  for (let hour = 8; hour < 23; hour++) {
    for (const [index, court] of courts.entries()) {
      slots.push({
        id: `${date}-${court.id}-${hour}`,
        date, courtId: court.id, locationId: court.locationId, start: hour * 60, end: (hour + 1) * 60,
        available: (seed + hour * 7 + index * 3) % 5 > 1,
      });
    }
  }
  return { source: 'demo', slots };
}
