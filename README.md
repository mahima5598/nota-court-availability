# North York Winter Tennis Club – court availability

A responsive court availability and booking prototype for non-members, styled
to match the North York Winter Tennis Club website. Uses plainly labeled,
deterministic sample data: four illustrative courts, hourly sessions from 8 am to
11 pm. These are not confirmed club courts, hours, or live availability.

## Run

Requires Node.js 22 or newer; no packages to install.

```sh
npm start
```

Open http://127.0.0.1:3000. Use `PORT=3001 npm start` for another port.
Run the booking-window tests with `npm test`.

## Booking windows

All calendar dates and times use `America/Toronto`.

- Monday-Friday outside 6-10 pm: up to five calendar days in advance.
- Monday-Friday 6-10 pm: same day only.
- Saturday-Sunday, all hours: up to one calendar day in advance.

Assumptions to confirm with the club: windows open at Toronto midnight, include
the current day, and use calendar days rather than rolling 24-hour periods.
Any session overlapping weekday 6-10 pm uses the prime-time rule; one ending
at 6 pm or starting at 10 pm is non-prime. Started sessions are not eligible.
The page recalculates eligibility every 30 seconds and at each interaction.

## Chelsea integration

`data.js` supplies `getAvailability(date)` and the sample court list. When API
access is available, add a server-side adapter (keep credentials on the server),
normalize court-local dates and start/end minutes to the existing slot shape,
and replace the sample provider. Return explicit live/source and freshness
metadata, validate the API response, and update the demo-only guard and labels
in `app.js` and `index.html` together. Handle failures visibly; never substitute
sample data for a failed live request. Confirm real hours, courts, session
lengths, refresh limits, and booking-window opening times with Chelsea.

## Booking

Selecting an available court opens `/book`, which collects name, email, and
phone and posts to `POST /api/bookings`. The server re-validates the details and
rechecks that the court is still available and inside the non-member window,
then calls `createChelseaBooking` in `chelsea.js`.

That adapter is not connected yet, so every valid submission returns a clear
"booking was not made" message (HTTP 503). No booking is confirmed until
Chelsea returns a booking reference.

Payment is not implemented. Card details must never be collected on this site;
use a hosted payment provider (to be chosen). Charge or authorize payment before
calling Chelsea, and refund or void it if the Chelsea booking fails.

Rates, authentication, deployment, and actual Chelsea integration are not
included yet. Availability does not guarantee a reservation;
any future booking endpoint must independently recheck eligibility and inventory.
