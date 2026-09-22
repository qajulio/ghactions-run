const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const REQUEST_TIMEOUT = 30000;
const MONTHS_PT = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

function parseDatePT(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return null;

  const numeric = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (numeric) {
    const date = new Date(parseInt(numeric[3], 10), parseInt(numeric[2], 10) - 1, parseInt(numeric[1], 10));
    if (!Number.isNaN(date.getTime())) return date;
  }

  const named = value.match(/(\d{1,2})(?:[ºª])?\s+(?:de\s+)?([A-Za-zçãõ]+)\s+(\d{4})/i);
  if (!named) return null;
  const month = MONTHS_PT[named[2].toLowerCase().slice(0, 3)];
  if (month == null) return null;
  const date = new Date(parseInt(named[3], 10), month, parseInt(named[1], 10));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimePT(text) {
  const match = String(text || '').match(/(\d{1,2})[:h](\d{2})/i);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function withTime(date, text) {
  if (!date) return null;
  const time = parseTimePT(text);
  if (!time) return date;
  const dated = new Date(date);
  dated.setHours(time.hour, time.minute, 0, 0);
  return dated;
}

function toAbsoluteUrl(base, href) {
  if (!href) return '';
  try {
    return new URL(href, base).href;
  } catch (_) {
    return '';
  }
}

function parseDistances(text) {
  const matches = String(text || '').match(/\d+(?:[.,]\d+)?\s*(?:km|k)\b/gi);
  return matches ? [...new Set(matches.map((value) => value.replace(/\s+/g, '').replace(',', '.').toUpperCase()))] : [];
}

function isSaoPauloCapital(text) {
  const value = String(text || '').toLowerCase();
  return /são paulo\s*(?:,|-|\||•|\s)\s*sp\b/.test(value) ||
    /sao paulo\s*(?:,|-|\||•|\s)\s*sp\b/.test(value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

async function getHtml(url, options = {}) {
  const { data } = await axios.get(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      ...(options.headers || {}),
    },
    timeout: options.timeout || REQUEST_TIMEOUT,
  });
  return data;
}

const iguanaScrape = async () => {
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

      const city = localization ? String(localization).split('|')[0].trim() : 'São Paulo';
      events.push({
        title,
        slug,
        date,
        dateText: dateText || '',
        distances,
        link,
        organizer: 'Iguana Sports',
        source: 'iguanasports.com.br',
        city,
        hasTime: true,
      });
  });

  return events;
};

const EXCLUDE_KEYWORDS = [
  'mtb', 'mountain bike', 'triatlo', 'triatlon', 'aquabike', 'duatlo',
  'ciclismo', 'bmx', 'velocross', 'skate', 'patins',
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

async function fetchTicketSportsEvents() {
  const API_BASE = 'https://www.ticketsports.com.br';
  const EVENTS_URL = `${API_BASE}/api/events/list`;
  const request = async (params) => {
    const { data } = await axios.get(EVENTS_URL, {
      params,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT,
    });
    return Array.isArray(data) ? data : (data && data.data ? data.data : []);
  };

  let list;
  try {
    list = await request({
      quantity: '100',
      atlheteId: '0',
      term: '',
      country: 'BR',
      region: 'SP',
      city: 'São Paulo',
      page: '1',
    });
  } catch (_) {
    list = await request({
      country: 'Brasil',
      state: 'São Paulo',
      city: 'São Paulo',
      period: '0',
    });
  }

  return list.filter((ev) => {
    const title = (ev.title || '').trim();
    const address = ev.address || '';
    return title &&
      isRunningEvent(title) &&
      !ev.isVirtualEvent &&
      /São Paulo\s*,\s*SP/i.test(address);
  }).map((ev) => {
    const title = (ev.title || '').trim();
    const date = ev.realDate ? new Date(ev.realDate) : parseDateBR(ev.date, ev.day, ev.month, ev.year);
    const addressCity = (ev.address || '').match(/^([^,]+)/);
    const city = addressCity ? addressCity[1].trim() : 'São Paulo';
    return {
      title,
      date: Number.isNaN(date.getTime()) ? null : date,
      dateText: ev.date || '',
      distances: [],
      link: ev.uri || '',
      organizer: (ev.organizer || '').trim(),
      status: ev.status || '',
      price: ev.price != null ? ev.price : (ev.fullPrice != null ? ev.fullPrice : null),
      fullPrice: ev.fullPrice != null ? ev.fullPrice : null,
      signUpDeadLine: ev.signUpDeadLine || '',
      city,
      hasTime: false,
    };
  });
}

let ticketSportsEventsPromise;
function getTicketSportsEvents() {
  if (!ticketSportsEventsPromise) {
    ticketSportsEventsPromise = fetchTicketSportsEvents();
  }
  return ticketSportsEventsPromise;
}

const ticketsportsScrape = async () => (await getTicketSportsEvents()).map((event) => ({
  ...event,
  source: 'ticketsports.com.br',
}));

const ticketAgoraScrape = async () => (await getTicketSportsEvents()).map((event) => ({
  ...event,
  source: 'ticketagora.com.br',
}));

const minhasInscricoesScrape = async () => (await getTicketSportsEvents()).map((event) => ({
  ...event,
  source: 'minhasinscricoes.com.br',
}));

const ativoScrape = async () => {
  const BASE_URL = 'https://www.ativo.com';
  const EVENTS_URL = `${BASE_URL}/eventos.json`;
  const { data } = await axios.get(EVENTS_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    timeout: REQUEST_TIMEOUT,
  });
  const list = Array.isArray(data) ? data : (data && data.events ? data.events : []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return list.filter((event) => {
    const city = String(event.ds_cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const type = String(event.ds_tipo_evento || '').toLowerCase();
    const date = event.dt_evento ? new Date(event.dt_evento.replace(' ', 'T')) : null;
    return event.tipo_de_evento === 'C' &&
      String(event.ds_estado || '').toUpperCase() === 'SP' &&
      city === 'sao paulo' &&
      type.includes('corrida') &&
      date &&
      !Number.isNaN(date.getTime()) &&
      date >= today;
  }).map((event) => {
    const date = new Date(event.dt_evento.replace(' ', 'T'));
    const detailUrl = String(event.post_json || '').replace(/\/index\.json$/, '');
    return {
      title: (event.post_title || '').trim(),
      date,
      dateText: event.dt_evento || '',
      distances: (event.distancias || []).map((distance) => String(distance.ds_distancia || '').trim()).filter(Boolean),
      link: toAbsoluteUrl(BASE_URL, detailUrl),
      organizer: (event.nome_organizador || 'Ativo').trim(),
      source: 'ativo.com',
      status: event.fl_suspenso === '1' ? 'Suspenso' : '',
      city: (event.ds_cidade || 'São Paulo').trim(),
      hasTime: false,
    };
  });
};

const RUNNING_LAND_QUERY = `query getEventCategoryFull($id: Int!, $search: String, $pageSize: Int!, $currentPage: Int!, $filters: ProductAttributeFilterInput!) {
  category(id: $id) { id name }
  products(search: $search, pageSize: $pageSize, currentPage: $currentPage, filter: $filters) {
    items {
      id
      name
      sku
      url_key
      event_product
      event_date
      event_region
      event_city
      event_modality
      label
      price { regularPrice { amount { currency value } } }
    }
    page_info { total_pages }
    total_count
  }
}`;
const RUNNING_LAND_MODALITIES = {
  3: '3K', 38: '5K', 41: '10K', 42: '21K', 928: '3K', 1550: '42K',
};

async function runningLandScrape() {
  const BASE_URL = 'https://www.runningland.com.br';
  const GRAPHQL_URL = `${BASE_URL}/graphql`;
  const events = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const { data } = await axios.post(GRAPHQL_URL, {
      query: RUNNING_LAND_QUERY,
      variables: {
        id: 3,
        search: '',
        pageSize: 100,
        currentPage,
        filters: {
          category_id: { eq: '3' },
          event_region: { eq: '53' },
          event_city: { eq: '26' },
        },
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      timeout: REQUEST_TIMEOUT,
    });

    if (data && data.errors && data.errors.length) {
      throw new Error(data.errors.map((error) => error.message).join('; '));
    }

    const products = data && data.data && data.data.products;
    const items = products && products.items ? products.items : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of items) {
      if (Number(item.event_product) !== 1 || Number(item.event_city) !== 26 || Number(item.event_region) !== 53) continue;
      if (!/corrida/i.test(item.label || '')) continue;
      const date = item.event_date ? new Date(item.event_date.replace(' ', 'T')) : null;
      if (!date || Number.isNaN(date.getTime()) || date < today) continue;

      const distances = String(item.event_modality || '')
        .split(',')
        .map((id) => RUNNING_LAND_MODALITIES[id] || `${id}K`)
        .filter(Boolean);
      const price = item.price && item.price.regularPrice && item.price.regularPrice.amount
        ? item.price.regularPrice.amount.value
        : null;

      events.push({
        title: (item.name || '').trim(),
        date,
        dateText: item.event_date || '',
        distances,
        link: item.url_key ? toAbsoluteUrl(BASE_URL, `${item.url_key}.html`) : '',
        organizer: 'Running Land',
        source: 'runningland.com.br',
        price,
        city: 'São Paulo',
        hasTime: true,
      });
    }

    totalPages = products && products.page_info ? parseInt(products.page_info.total_pages, 10) : 1;
    if (Number.isNaN(totalPages) || totalPages < 1) totalPages = 1;
    currentPage += 1;
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

const esportividadeScrape = async () => {
  const BASE_URL = 'https://esportividade.com.br';
  const events = [];
  const seen = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let page = 1; page <= 18; page += 1) {
    const url = page === 1 ? `${BASE_URL}/agenda/` : `${BASE_URL}/agenda/page/${page}/`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      timeout: REQUEST_TIMEOUT,
    });
    const $ = cheerio.load(data);
    let found = 0;

    $('article.resultado_busca_post').each((_, card) => {
      const $card = $(card);
      const title = $card.find('.titulo a').text().replace(/\s+/g, ' ').trim();
      const location = $card.find('#infos p').text().replace(/\s+/g, ' ').trim();
      const modality = $card.find('.modalidade').text().replace(/\s+/g, ' ').trim();
      if (!title || !/São Paulo\s*-\s*(Centro|Zona (Norte|Sul|Leste|Oeste)|Todas as Regiões)/i.test(location)) return;
      if (!/corrida/i.test(modality)) return;
      if (/trein|bate-papo|kids|infantil|virtual|online/i.test(title)) return;

      const dateText = $card.find('.agenda .dia').text().replace(/\s+/g, ' ').trim();
      const date = withTime(parseDatePT(dateText), dateText);
      if (!date || date < today) return;

      const href = $card.find('.titulo a').attr('href') || '';
      const link = toAbsoluteUrl(BASE_URL, href);
      const key = `${title}|${date.getTime()}`;
      if (seen.has(key)) return;
      seen.add(key);
      found += 1;

      events.push({
        title,
        date,
        dateText,
        distances: [],
        link,
        organizer: 'Esportividade',
        source: 'esportividade.com.br',
        city: 'São Paulo',
        hasTime: true,
      });
    });

    if (!found && page > 1) break;
    if (page < 18) await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

function decodeSymplaPayloads(html) {
  const payloads = [];
  let cursor = 0;
  while ((cursor = html.indexOf('<script', cursor)) >= 0) {
    const end = html.indexOf('</script>', cursor);
    if (end < 0) break;
    const content = html.slice(cursor, end);
    cursor = end + 9;
    if (!content.includes('response_type') && !content.includes('dataSectionMoreEvents')) continue;
    const marker = content.indexOf('push');
    const start = content.indexOf('"', marker);
    const finish = content.lastIndexOf('"');
    if (marker < 0 || start < 0 || finish <= start) continue;
    try {
      payloads.push(JSON.parse(content.slice(start, finish + 1)));
    } catch (_) {
      // Ignore malformed Flight payloads.
    }
  }
  return payloads;
}

function readJsonObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') depth -= 1;
    if (depth === 0) {
      try {
        return { value: JSON.parse(text.slice(start, index + 1)), end: index + 1 };
      } catch (_) {
        return null;
      }
    }
  }
  return null;
}

function extractSymplaEvents(payload) {
  const events = [];
  let cursor = 0;
  while ((cursor = payload.indexOf('"dataSectionMoreEvents":{"', cursor)) >= 0) {
    const start = payload.indexOf('{', cursor);
    const parsed = readJsonObject(payload, start);
    if (!parsed) break;
    if (Array.isArray(parsed.value.data)) events.push(...parsed.value.data);
    cursor = parsed.end;
  }

  cursor = 0;
  while ((cursor = payload.indexOf('"response":{"data":[', cursor)) >= 0) {
    const start = payload.indexOf('{', cursor);
    const parsed = readJsonObject(payload, start);
    if (!parsed) break;
    if (Array.isArray(parsed.value.data)) events.push(...parsed.value.data);
    cursor = parsed.end;
  }
  return events;
}

const symplaSportsScrape = async () => {
  const URL = 'https://www.sympla.com.br/eventos/sao-paulo-sp/esportivo';
  const { data } = await axios.get(URL, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    timeout: REQUEST_TIMEOUT,
  });
  const events = [];
  const seen = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const payload of decodeSymplaPayloads(data)) {
    for (const event of extractSymplaEvents(payload)) {
      const location = event.location || {};
      if (location.city !== 'São Paulo' || location.state !== 'SP') continue;
      const title = (event.name || '').trim();
      if (!/corrida|run|maratona|meia|trail|cicl|pedal|triathlon|duatlo|obst/i.test(title)) continue;
      const date = event.start_date ? new Date(event.start_date) : null;
      if (!date || Number.isNaN(date.getTime()) || date < today) continue;
      const key = `${title}|${date.getTime()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dateText = event.start_date_formats && event.start_date_formats.pt
        ? event.start_date_formats.pt
        : event.start_date;

      events.push({
        title,
        date,
        dateText: dateText || '',
        distances: parseDistances(title),
        link: event.url || '',
        organizer: (event.organizer && event.organizer.name) || 'Sympla Sports',
        source: 'sympla.com.br',
        city: (location.city || 'São Paulo').trim(),
        hasTime: true,
      });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const yescomScrape = async () => {
  const BASE_URL = 'https://www.yescom.com.br';
  const CALENDAR_URLS = [2026, 2027].map((year) => `${BASE_URL}/site/calendarioYescomnovo${year}.html`);
  const events = [];
  const seen = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const url of CALENDAR_URLS) {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      timeout: REQUEST_TIMEOUT,
    });
    const $ = cheerio.load(data);

    $('.evento-card').each((_, card) => {
      const $card = $(card);
      const $column = $card.closest('.evento-col');
      const title = $card.find('.evento-conteudo > h2').text().replace(/\s+/g, ' ').trim();
      if (!title) return;

      const location = $card.find('.evento-local').text().replace(/\s+/g, ' ').trim();
      if (!/•\s*SP\b/i.test(location)) return;

      const dateText = $card.find('.evento-data').text().replace(/\s+/g, ' ').trim();
      const date = parseDatePT(dateText);
      if (!date || date < today) return;

      const href = $card.find('.evento-botao[href]').attr('href') || '';
      const link = toAbsoluteUrl(BASE_URL, href);
      const statusClass = ($column.attr('class') || '').match(/\b(esgotado|aberto|breve|expo|atencao)\b/i);
      const status = statusClass ? statusClass[1].toLowerCase() : '';
      const key = `${title}|${date.getTime()}`;
      if (seen.has(key)) return;
      seen.add(key);

      events.push({
        title,
        date,
        dateText,
        distances: [],
        link,
        organizer: 'Yescom',
        source: 'yescom.com.br',
        status,
        city: 'São Paulo',
        hasTime: false,
      });
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const SCRAPERS = [
  { scrape: iguanaScrape, SOURCE_NAME: 'iguanasports.com.br' },
  { scrape: ticketsportsScrape, SOURCE_NAME: 'ticketsports.com.br' },
  { scrape: ticketAgoraScrape, SOURCE_NAME: 'ticketagora.com.br' },
  { scrape: yescomScrape, SOURCE_NAME: 'yescom.com.br' },
];

async function scrapeAll() {
  const results = await Promise.all(
    SCRAPERS.map(async (s) => {
      try {
        const events = await s.scrape();
        return { source: s.SOURCE_NAME, events, error: null };
      } catch (err) {
        return { source: s.SOURCE_NAME, events: [], error: err.message };
      }
    })
  );
  return results;
}

module.exports = { scrapeAll, SCRAPERS };
