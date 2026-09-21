const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://iguanasports.com.br';
const CALENDAR_URL = `${BASE_URL}/blogs/calendario-corridas-de-rua`;

const MONTHS_PT = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

function parseDateText(text) {
  const m = String(text || '').trim().match(/(\d{1,2})\s+([A-Za-zç]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const month = MONTHS_PT[m[2].toLowerCase().slice(0, 3)];
  if (month == null) return null;
  const d = parseInt(m[1], 10);
  const y = parseInt(m[3], 10);
  const h = parseInt(m[4], 10);
  const min = parseInt(m[5], 10);
  return new Date(y, month, d, h, min);
}

function toAbsolute(href) {
  if (!href) return null;
  return href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

async function scrape() {
  const { data } = await axios.get(CALENDAR_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
    timeout: 30000,
  });
  const $ = cheerio.load(data);
  const events = [];

  $('.item-article-blog').each((_, item) => {
    const $item = $(item);
    const ts = $item.attr('data-date');
    const card = $item.find('.article-card').first();
    if (!card.length) return;

    const slug = card.attr('data-title') || '';
    const title = (card.find('.article-card__title a .text').text().trim() ||
      card.find('.article-card__title').text().trim() ||
      slug);
    if (!title) return;

    const link = toAbsolute(card.find('.article-card__title a').attr('href') || card.attr('data-title'));
    const localization =
      card.attr('data-localization') || card.find('.article-card__pin').text().trim();
    const distancesRaw = card.attr('data-distance') || '';
    const dateText = $item.find('.article-card__running-date .text').text().trim();
    const year = card.attr('data-year');

    const isSaoPaulo = /São Paulo\s*\|\s*SP/.test(localization || '');
    if (!isSaoPaulo) return;

    let date = null;
    if (ts) {
      const d = new Date(parseInt(ts, 10) * 1000);
      if (!Number.isNaN(d.getTime())) date = d;
    }
    if (!date) date = parseDateText(dateText);
    if (!date && year) {
      const fallback = parseDateText(dateText);
      if (fallback) date = fallback;
    }

    const distances = distancesRaw
      ? distancesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    events.push({
      title,
      slug,
      date,
      dateText: dateText || '',
      distances,
      link,
      organizer: 'Iguana Sports',
      source: 'iguanasports.com.br',
      hasTime: true,
    });
  });

  return events;
}

module.exports = { scrape, SOURCE_NAME: 'iguanasports.com.br' };
