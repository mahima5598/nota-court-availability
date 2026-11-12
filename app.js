import { addDays, clubClock, dateLabel, eligibility, timeLabel } from './availability.js';
import { courts, locations, getAvailability } from './data.js';

const $ = (selector) => document.querySelector(selector);
let today = clubClock().date;
let selectedDate = today;
let slots = [];
let requestId = 0;
let loadError = false;

for (const location of locations) {
  $('#location-filter').add(new Option(`${location.name} (Courts 1–${location.courtCount})`, location.id));
}

function renderDates() {
  $('#date-range').textContent = dateLabel(selectedDate, { month: 'long', year: 'numeric' });
  $('#dates').replaceChildren(...Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `date-button${date === selectedDate ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(date === selectedDate));
    button.setAttribute('aria-label', dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' }));
    button.innerHTML = `<span>${dateLabel(date, { weekday: 'short' })}</span><strong>${dateLabel(date, { day: 'numeric' })}</strong><small>${index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : dateLabel(date, { month: 'short' })}</small>`;
    button.addEventListener('click', () => { selectedDate = date; renderDates(); loadSlots(); });
    return button;
  }));
}

function renderResults() {
  if (loadError) return;
  const now = new Date();
  const locationFilter = $('#location-filter').value;
  const timeFilter = $('#time-filter').value;
  const eligibleOnly = $('#eligible-filter').checked;
  const filtered = slots.filter((slot) =>
    (locationFilter === 'all' || slot.locationId === locationFilter) &&
    (timeFilter === 'all' || (timeFilter === 'morning' && slot.start < 720) ||
      (timeFilter === 'afternoon' && slot.start >= 720 && slot.start < 1080) ||
      (timeFilter === 'evening' && slot.start >= 1080)) &&
    (!eligibleOnly || (slot.available && eligibility(slot, now).eligible)));
  const availableCount = filtered.filter((slot) => slot.available && eligibility(slot, now).eligible).length;
  $('#selected-heading').textContent = dateLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#results-summary').textContent = `${availableCount} eligible sample ${availableCount === 1 ? 'slot' : 'slots'}${eligibleOnly ? '' : ` · ${filtered.length} total slots shown`} · 60-minute sessions`;
  const results = $('#results');
  results.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<span aria-hidden="true">&#9684;</span><h4>No matching sample slots</h4><p>${eligibleOnly ? 'Try another date or filter, or turn off “Show only courts I can book” to see booking windows.' : 'Try a different location or time of day.'}</p>`;
    results.append(empty);
    return;
  }
  const hours = [...new Set(filtered.map((slot) => slot.start))];
  for (const hour of hours) {
    const row = document.createElement('div');
    row.className = 'time-row';
    const heading = document.createElement('div');
    heading.className = 'time-heading';
    heading.innerHTML = `<strong>${timeLabel(hour)}</strong><span>${timeLabel(hour + 60)} end</span>`;
    row.append(heading);
    const cards = document.createElement('div');
    cards.className = 'slot-cards';
    for (const slot of filtered.filter((item) => item.start === hour)) {
      const rule = eligibility(slot, now);
      const status = !slot.available ? 'reserved' : rule.eligible ? 'available' : 'locked';
      const court = courts.find((item) => item.id === slot.courtId);
      const card = document.createElement(status === 'available' ? 'a' : 'article');
      card.className = `slot-card ${status}`;
      if (status === 'available') {
        card.href = `./book.html?${new URLSearchParams({ date: slot.date, court: slot.courtId, start: slot.start })}`;
        card.setAttribute('aria-label', `Book ${court.locationName}, ${court.name} at ${timeLabel(slot.start)}`);
      }
      card.innerHTML = `<div class="slot-top"><strong>${court.name}</strong><span class="slot-icon" aria-hidden="true">${status === 'available' ? '&#8599;' : status === 'locked' ? '&#9707;' : '&#8212;'}</span></div><span class="slot-type">${rule.label} <span>· 60 min</span></span><div class="slot-status"><i class="dot ${status}-dot"></i>${!slot.available ? 'Unavailable' : rule.eligible ? 'Available' : rule.reason}</div>`;
      const locationLabel = document.createElement('span');
      locationLabel.className = 'slot-location';
      locationLabel.textContent = court.locationName;
      card.prepend(locationLabel);
      cards.append(card);
    }
    row.append(cards);
    results.append(row);
  }
}

async function loadSlots() {
  const id = ++requestId;
  loadError = false;
  $('#results').setAttribute('aria-busy', 'true');
  $('#refresh').disabled = true;
  $('#results-summary').textContent = 'Loading sample availability…';
  $('#results').replaceChildren();
  try {
    const data = await getAvailability(selectedDate);
    if (id !== requestId) return;
    if (data.source !== 'demo') throw new Error('Unconfigured availability source');
    slots = data.slots;
    renderResults();
  } catch (error) {
    if (id !== requestId) return;
    loadError = true;
    console.error('Unable to load court availability', error);
    $('#results-summary').textContent = 'Availability could not be loaded.';
    $('#results').innerHTML = '<div class="empty-state" role="alert"><h4>Unable to load availability</h4><p>Please use Refresh sample to try again.</p></div>';
  } finally {
    if (id === requestId) {
      $('#results').setAttribute('aria-busy', 'false');
      $('#refresh').disabled = false;
    }
  }
}

function tick() {
  $('#clock').textContent = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit',
  }).format(new Date());
  const currentDate = clubClock().date;
  if (currentDate !== today) {
    today = currentDate;
    if (selectedDate < today) selectedDate = today;
    renderDates();
    loadSlots();
  } else if ($('#results').getAttribute('aria-busy') !== 'true') {
    renderResults();
  }
}

for (const selector of ['#location-filter', '#time-filter', '#eligible-filter']) {
  $(selector).addEventListener('change', renderResults);
}
$('#refresh').addEventListener('click', loadSlots);
renderDates();
tick();
loadSlots();
setInterval(tick, 30_000);
