import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { validateBooking } from './booking.js';
import { ChelseaNotConfiguredError, createChelseaBooking } from './chelsea.js';
import { getAvailability } from './data.js';

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/book': ['book.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/book-page.js': ['book-page.js', 'text/javascript; charset=utf-8'],
  '/booking.js': ['booking.js', 'text/javascript; charset=utf-8'],
  '/availability.js': ['availability.js', 'text/javascript; charset=utf-8'],
  '/data.js': ['data.js', 'text/javascript; charset=utf-8'],
  '/logo.png': ['logo.png', 'image/png'],
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new Error('Request too large');
  }
  return JSON.parse(body);
}

async function handleBooking(request, response) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    return sendJson(response, 415, { error: 'Expected JSON.' });
  }
  let input;
  try {
    input = await readJson(request);
  } catch {
    return sendJson(response, 400, { error: 'Invalid booking request.' });
  }
  const { slots } = await getAvailability(String(input?.date ?? ''));
  const { errors, booking, slot } = validateBooking(input, slots);
  if (Object.keys(errors).length) return sendJson(response, 422, { errors });
  try {
    const result = await createChelseaBooking({ ...booking, slot });
    return sendJson(response, 201, { reference: result.reference });
  } catch (error) {
    if (error instanceof ChelseaNotConfiguredError) {
      return sendJson(response, 503, { error: 'Online booking is not connected to Chelsea yet, so this booking was not made. Please contact the club to book.' });
    }
    console.error('Chelsea booking failed', error);
    return sendJson(response, 502, { error: 'The booking could not be completed. Please try again or contact the club.' });
  }
}

const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  try {
    if (path === '/api/bookings') {
      if (request.method !== 'POST') return response.writeHead(405, { Allow: 'POST' }).end('Method not allowed');
      return await handleBooking(request, response);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    }
    const file = files[path];
    if (!file) return response.writeHead(404).end('Not found');
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('Request failed', error);
    if (!response.headersSent) response.writeHead(500).end('Something went wrong');
  }
});

server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
  console.log(`Court availability: http://127.0.0.1:${server.address().port}`);
});
