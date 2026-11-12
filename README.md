# Public/Non-Member Court Availability

[Open the website](https://mahima5598.github.io/nota-court-availability/)

The link above works **after GitHub Pages is enabled** using the steps below.

## Free hosting and sharing with GitHub Pages

This session cannot change repository visibility or GitHub Pages settings.
Complete these steps on GitHub:

1. In this repository, open **Settings > General > Danger Zone > Change repository visibility** and make it **Public**. This publishes all source code and commit history; do not add secrets or customer data.
2. Open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**, then **Save**.
5. Wait for the Pages deployment to finish (check the **Actions** tab), then open the website link above and share it.

Subsequent pushes to `main` update the shared site automatically. GitHub Pages
hosts static files for free for public repositories; it does not run `npm start`,
`server.js`, or a booking API. This hosted site is a clearly marked preview:
sample availability and fictional form submissions only. The demo validates
details locally without sending or storing them. A backend host will be needed
for real Chelsea integration and payments; never put credentials in the
repository or browser files.

A responsive court availability and booking prototype for non-members, styled
to match the North York Winter Tennis Club website. Uses plainly labeled,
deterministic sample availability, hourly sessions from 8 am to 11 pm.
Locations: North Bubble (Courts 1-4), South Bubble (Courts 5-10), and East Bubble
(Courts 11-14). Each court has a location-specific ID so court numbers cannot be
confused between locations. Hours are illustrative, not confirmed live data.
The browser title and favicon use the public/non-member name and club logo.

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

Selecting an available court opens `book.html`, showing the location, court,
date, and time. The demo form validates fictional name, email, and phone locally
and explicitly reports that no booking was made. It never submits sample
details to a server, including on GitHub Pages.

The local server retains `POST /api/bookings` for future integration. It re-validates the details and
rechecks that the court is still available and inside the non-member window,
then calls `createChelseaBooking` in `chelsea.js`.

That adapter is not connected yet, so every valid direct API request returns a clear
"booking was not made" message (HTTP 503). No booking is confirmed until
Chelsea returns a booking reference.

Payment is not implemented. Card details must never be collected on this site;
use a hosted payment provider (to be chosen). Charge or authorize payment before
calling Chelsea, and refund or void it if the Chelsea booking fails.

Rates, authentication, deployment, and actual Chelsea integration are not
included yet. Availability does not guarantee a reservation;
any future booking endpoint must independently recheck eligibility and inventory.
