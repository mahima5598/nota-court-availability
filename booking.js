import { eligibility } from './availability.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function findSlot(slots, { date, courtId, start }) {
  return slots.find((slot) => slot.date === date && slot.courtId === courtId && slot.start === Number(start));
}

export function validateBooking(input, slots, now = new Date()) {
  const errors = {};
  const name = String(input?.name ?? '').trim();
  const email = String(input?.email ?? '').trim();
  const phone = String(input?.phone ?? '').trim();
  if (name.length < 2 || name.length > 100) errors.name = 'Enter your full name.';
  if (!EMAIL.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  const digits = phone.replace(/\D/g, '');
  if (!/^[\d\s()+.-]+$/.test(phone) || digits.length < 10 || digits.length > 15) errors.phone = 'Enter a valid phone number.';

  const slot = findSlot(slots, { date: input?.date, courtId: input?.courtId, start: input?.start });
  if (!slot) errors.slot = 'This court time could not be found.';
  else if (!slot.available) errors.slot = 'This court is no longer available.';
  else if (!eligibility(slot, now).eligible) errors.slot = 'This court time is outside the non-member booking window.';

  return { errors, booking: { name, email, phone }, slot };
}
