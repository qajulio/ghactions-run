const axios = require('axios');

const API_BASE = 'https://www.ticketsports.com.br';
const EVENTS_URL = `${API_BASE}/api/events/list`;

const EXCLUDE_KEYWORDS = [
  'mtb', 'mountain bike', 'triatlo', 'triatlon', 'aquabike', 'duatlo',
  'ciclismo', 'ciclismo', 'bmx', 'velocross', 'skate', 'patins',
];

function isRunningEvent(title) {
  const t = (title || '').toLowerCase();
  return !EXCLUDE_KEYWORDS.some((k) => t.includes(k));
}

function parseDateBR(dateStr, day, month, year) {
  if (day && month && year) {
    const parts = String(month).toLowerCase().slice(0, 3);
    const map = {
      jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
      jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
    };
    const m = map[parts];
    if (m != null) return new Date(parseInt(year, 10), m, parseInt(day, 10));
  }
  if (dateStr) {
    const m = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  return null;
}

async function scrape() {
  const { data } = await axios.get(EVENTS_URL, {
    params: {
      country: 'Brasil',
      state: 'São Paulo',
      city: 'São Paulo',
      period: '0',
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'application/json',
    },
    timeout: 30000,
  });

  const list = Array.isArray(data) ? data : (data && data.data ? data.data : []);
  const events = [];

  for (const ev of list) {
    const title = (ev.title || '').trim();
    if (!title) continue;
    if (!isRunningEvent(title)) continue;

    const address = ev.address || '';
    const isSaoPaulo = /São Paulo\s*,\s*SP/.test(address);
    if (!isSaoPaulo) continue;

    const date = parseDateBR(ev.date, ev.day, ev.month, ev.year);

    events.push({
      title,
      date,
      dateText: ev.date || '',
      distances: [],
      link: ev.uri || '',
      organizer: (ev.organizer || '').trim(),
      source: 'ticketsports.com.br',
      status: ev.status || '',
      hasTime: false,
    });
  }

  return events;
}

module.exports = { scrape, SOURCE_NAME: 'ticketsports.com.br' };
