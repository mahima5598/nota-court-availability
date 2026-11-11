export const TIME_ZONE = 'America/Toronto';

export function clubClock(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60,
  };
}

export function addDays(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function dateLabel(date, options) {
  return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

export function bookingWindow(slot) {
  const weekday = new Date(`${slot.date}T12:00:00Z`).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const prime = !weekend && slot.start < 22 * 60 && slot.end > 18 * 60;
  return { days: weekend ? 1 : prime ? 0 : 5, label: weekend ? 'Weekend' : prime ? 'Prime time' : 'Non-prime' };
}

export function eligibility(slot, now = new Date()) {
  const clock = clubClock(now);
  const window = bookingWindow(slot);
  const opens = addDays(slot.date, -window.days);
  if (slot.date < clock.date || (slot.date === clock.date && slot.start <= clock.minutes)) {
    return { eligible: false, reason: 'Time passed', ...window, opens };
  }
  if (clock.date < opens) {
    return { eligible: false, reason: `Opens ${dateLabel(opens, { month: 'short', day: 'numeric' })}`, ...window, opens };
  }
  return { eligible: true, reason: 'Available to non-members', ...window, opens };
}

export function timeLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, '0')}` : ''} ${hour >= 12 ? 'pm' : 'am'}`;
}
