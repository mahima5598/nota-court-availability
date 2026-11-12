import { dateLabel, eligibility, timeLabel } from './availability.js';
import { findSlot, validateBooking } from './booking.js';
import { courts, getAvailability } from './data.js';

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const request = { date: params.get('date'), courtId: params.get('court'), start: Number(params.get('start')) };
const summary = $('#slot-summary');
const form = $('#booking-form');
let availability;

function showUnavailable(message) {
  summary.className = 'slot-summary error';
  summary.innerHTML = `<strong>${message}</strong><a href="./">Choose another court</a>`;
  form.hidden = true;
}

async function init() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date || '') || !Number.isInteger(request.start)) {
    showUnavailable('No court was selected.');
    return;
  }
  try {
    availability = await getAvailability(request.date);
    const { slots } = availability;
    const slot = findSlot(slots, request);
    const court = courts.find((item) => item.id === request.courtId);
    if (!slot || !court) return showUnavailable('This court time could not be found.');
    if (!slot.available || !eligibility(slot).eligible) return showUnavailable('This court is no longer available to non-members.');
    summary.innerHTML = `<span class="summary-label">Selected court</span><strong>${court.locationName} · ${court.name}</strong><span>${dateLabel(slot.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span><span>${timeLabel(slot.start)} – ${timeLabel(slot.end)} · ${eligibility(slot).label}</span>`;
    form.hidden = false;
  } catch (error) {
    console.error('Unable to load court', error);
    showUnavailable('Court details could not be loaded.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('#form-message');
  const button = $('#submit');
  message.hidden = true;
  for (const field of ['name', 'email', 'phone']) {
    $(`#${field}-error`).textContent = '';
    $(`#${field}`).removeAttribute('aria-invalid');
  }
  button.disabled = true;
  button.textContent = 'Submitting…';
  try {
    const input = { ...Object.fromEntries(new FormData(form)), ...request };
    if (availability?.source === 'demo') {
      const { errors } = validateBooking(input, availability.slots);
      for (const [field, text] of Object.entries(errors)) {
        const error = $(`#${field}-error`);
        if (error) {
          error.textContent = text;
          $(`#${field}`).setAttribute('aria-invalid', 'true');
        }
      }
      message.className = 'form-message error';
      message.textContent = errors.slot || (Object.keys(errors).length
        ? 'Please correct the highlighted fields.'
        : 'Preview only: no booking was made and no details were sent. Chelsea and payments are not connected. Please contact the club to book.');
      message.hidden = false;
      return;
    }
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      message.className = 'form-message success';
      message.textContent = `Booking confirmed. Reference: ${result.reference}`;
      form.querySelectorAll('input, button').forEach((element) => { element.disabled = true; });
      button.textContent = 'Booked';
      message.hidden = false;
      return;
    }
    for (const [field, text] of Object.entries(result.errors || {})) {
      const error = $(`#${field}-error`);
      if (error) {
        error.textContent = text;
        $(`#${field}`).setAttribute('aria-invalid', 'true');
      }
    }
    message.className = 'form-message error';
    message.textContent = result.errors?.slot || result.error || 'Please correct the highlighted fields.';
    message.hidden = false;
  } catch (error) {
    console.error('Booking request failed', error);
    message.className = 'form-message error';
    message.textContent = 'Your booking could not be submitted. Please try again.';
    message.hidden = false;
  } finally {
    if (button.textContent === 'Submitting…') {
      button.disabled = false;
      button.textContent = 'Submit booking';
    }
  }
});

init();
