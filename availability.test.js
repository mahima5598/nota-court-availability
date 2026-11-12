import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, bookingWindow, clubClock, eligibility } from './availability.js';

const slot = (date, start = 600, end = start + 60) => ({ date, start, end });
const monday = new Date('2026-11-09T14:00:00Z'); // 9 am Toronto

test('weekday non-prime opens five calendar days ahead, inclusive', () => {
  assert.equal(eligibility(slot('2026-11-13'), monday).eligible, true);
  assert.equal(eligibility(slot('2026-11-16'), new Date('2026-11-11T14:00:00Z')).eligible, true);
  assert.equal(eligibility(slot('2026-11-16'), new Date('2026-11-10T14:00:00Z')).eligible, false);
});

test('weekday prime is same-day only', () => {
  assert.equal(eligibility(slot('2026-11-09', 1080), monday).eligible, true);
  assert.equal(eligibility(slot('2026-11-10', 1080), monday).eligible, false);
});

test('prime boundaries include overlapping sessions but exclude 10 pm starts', () => {
  assert.equal(bookingWindow(slot('2026-11-09', 1020)).days, 5);
  assert.equal(bookingWindow(slot('2026-11-09', 1080)).days, 0);
  assert.equal(bookingWindow(slot('2026-11-09', 1290, 1350)).days, 0);
  assert.equal(bookingWindow(slot('2026-11-09', 1320)).days, 5);
  assert.equal(bookingWindow(slot('2026-11-09', 1050, 1110)).days, 0);
});

test('both weekend days open one day ahead, including evening hours', () => {
  for (const [date, before, open] of [
    ['2026-11-14', '2026-11-12', '2026-11-13'],
    ['2026-11-15', '2026-11-13', '2026-11-14'],
  ]) {
    assert.equal(eligibility(slot(date, 1140), new Date(`${before}T14:00:00Z`)).eligible, false);
    assert.equal(eligibility(slot(date, 1140), new Date(`${open}T14:00:00Z`)).eligible, true);
    assert.equal(eligibility(slot(date, 1140), new Date(`${date}T14:00:00Z`)).eligible, true);
  }
});

test('past dates and sessions that have started are not eligible', () => {
  assert.equal(eligibility(slot('2026-11-08'), monday).eligible, false);
  assert.equal(eligibility(slot('2026-11-09', 540), monday).eligible, false);
  assert.equal(eligibility(slot('2026-11-09', 541), monday).eligible, true);
});

test('opening dates follow Toronto midnight, not UTC midnight', () => {
  const future = slot('2026-11-14');
  assert.equal(eligibility(future, new Date('2026-11-13T04:59:59Z')).eligible, false);
  assert.equal(eligibility(future, new Date('2026-11-13T05:00:00Z')).eligible, true);
});

test('calendar arithmetic remains stable across DST and year boundaries', () => {
  assert.equal(addDays('2026-03-06', 5), '2026-03-11');
  assert.equal(addDays('2026-10-30', 5), '2026-11-04');
  assert.equal(addDays('2026-12-30', 5), '2027-01-04');
  assert.deepEqual(clubClock(new Date('2026-03-08T07:00:00Z')), { date: '2026-03-08', minutes: 180 });
  assert.equal(eligibility(slot('2026-03-11'), new Date('2026-03-06T14:00:00Z')).eligible, true);
});

import { validateBooking } from './booking.js';

const bookingSlots = [
  { date: '2026-11-09', courtId: 'court-1', start: 600, end: 660, available: true },
  { date: '2026-11-09', courtId: 'court-2', start: 600, end: 660, available: false },
  { date: '2026-11-10', courtId: 'court-1', start: 1080, end: 1140, available: true },
];
const details = { name: 'Alex Player', email: 'alex@example.com', phone: '(416) 555-0123' };

test('booking accepts valid details for an eligible available slot', () => {
  const result = validateBooking({ ...details, date: '2026-11-09', courtId: 'court-1', start: '600' }, bookingSlots, monday);
  assert.deepEqual(result.errors, {});
  assert.equal(result.slot, bookingSlots[0]);
});

test('booking rejects invalid details and unbookable slots', () => {
  const invalid = validateBooking({ name: 'A', email: 'nope', phone: '123', date: '2026-11-09', courtId: 'court-1', start: 600 }, bookingSlots, monday);
  assert.deepEqual(Object.keys(invalid.errors).sort(), ['email', 'name', 'phone']);
  assert.match(validateBooking({ ...details, date: '2026-11-09', courtId: 'court-2', start: 600 }, bookingSlots, monday).errors.slot, /no longer available/);
  assert.match(validateBooking({ ...details, date: '2026-11-10', courtId: 'court-1', start: 1080 }, bookingSlots, monday).errors.slot, /outside/);
  assert.match(validateBooking({ ...details, date: '2026-11-09', courtId: 'court-9', start: 600 }, bookingSlots, monday).errors.slot, /could not be found/);
});
