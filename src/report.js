const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado', 'segunda'];

function formatDate(date, showTime) {
  if (!date || Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(showTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(date));
}

function dedupe(events) {
  const seen = new Set();
  const out = [];
  for (const e of events) {
    const key = `${String(e.title || '').toLowerCase().replace(/\s+/g, ' ').replace(/\b(20\d{2})\b/g, '').trim()}|${e.date ? new Date(e.date).getTime() : ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function groupByDateAndCity(events) {
  const grouped = {};
  for (const e of events) {
    const dateKey = e.date ? e.date.toISOString().slice(0, 10) : 'sem-data';
    const city = e.city || 'São Paulo';
    if (!grouped[dateKey]) grouped[dateKey] = { date: e.date, cities: {} };
    if (!grouped[dateKey].cities[city]) grouped[dateKey].cities[city] = [];
    grouped[dateKey].cities[city].push(e);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'sem-data') return 1;
    if (b === 'sem-data') return -1;
    return grouped[a].date.getTime() - grouped[b].date.getTime();
  });
  return sortedDates.map((dateKey) => ({
    date: grouped[dateKey].date,
    dateKey,
    cities: grouped[dateKey].cities,
  }));
}

function formatPrice(price) {
  if (price == null || price === '') return 'A consultar';
  const num = Number(price);
  if (Number.isNaN(num)) return 'A consultar';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

function buildBody(events) {
  if (!events.length) {
    return '<p>Nenhuma corrida foi encontrada hoje.</p>';
  }
  const grouped = groupByDateAndCity(events);
  const dateGroups = grouped.map((g) => {
    const dateStr = g.date ? formatDate(g.date, false) : 'Data não informada';
    const cityEntries = Object.entries(g.cities).sort(([a], [b]) => a.localeCompare(b));
    const cityHtml = cityEntries.map(([city, cityEvents]) => {
      const rows = cityEvents.map((e) => {
        const dist = (e.distances && e.distances.length) ? e.distances.join(', ') : '-';
        const dateStr = formatDate(e.date, e.hasTime);
        const priceStr = formatPrice(e.price);
        const extra = e.status ? `<br><strong>Status:</strong> ${escapeHtml(e.status)}` : '';
        const org = e.organizer ? `<br><strong>Organizador:</strong> ${escapeHtml(e.organizer)}` : '';
        const link = e.link ? `<a href="${e.link}">${escapeHtml(e.title)}</a>` : escapeHtml(e.title);
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
            <strong>${link}</strong><br>
            <strong>Data:</strong> ${escapeHtml(dateStr)}<br>
            <strong>Distâncias:</strong> ${escapeHtml(dist)}<br>
            <strong>Site:</strong> ${escapeHtml(e.source)}${org}${extra}<br>
            <strong>Valor da inscrição:</strong> ${escapeHtml(priceStr)}
          </td>
        </tr>`;
      }).join('\n');
      return `<h3 style="margin:16px 0 8px;color:#444;">${escapeHtml(city)}</h3>
<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
${rows}
</table>`;
    }).join('\n');
    return `<h2 style="color:#333;border-bottom:1px solid #ddd;padding-bottom:6px;margin-top:24px;">${escapeHtml(dateStr)}</h2>
${cityHtml}`;
  }).join('\n');
  return `<p>Corridas em São Paulo-SP hoje:</p>
${dateGroups}
<p style="color:#555;font-size:12px;">Gerado automaticamente via GitHub Actions — <em>Corridas SP </em>.</p>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function generateReport(events) {
  const unique = dedupe(events);
  const body = buildBody(unique);
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 19).replace('T', ' ');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Corridas SP - via GIT</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #333; background: #fafafa; }
  h1 { color: #222; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
  .meta { color: #777; font-size: 13px; margin-bottom: 20px; }
  table { background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .empty { text-align: center; padding: 40px; color: #999; }
  footer { margin-top: 30px; color: #aaa; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<h1>Corridas de Rua em São Paulo - SP</h1>
<p class="meta">Gerado em: ${dateStamp} (horário de São Paulo — UTC-3)</p>
${body}
<footer>Automatização — Corridas SP - by Julio Mishima CTAI)</footer>
</body>
</html>`;
}

function generateMarkdown(events) {
  const unique = dedupe(events);
  const lines = [];
  lines.push('# Corridas de Rua em São Paulo Capital');
  lines.push('');
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 19).replace('T', ' ');
  lines.push(`Gerado em: ${dateStamp} (horário de São Paulo — UTC-3)`);
  lines.push('');

  if (!unique.length) {
    lines.push('Nenhuma corrida de rua em São Paulo capital foi encontrada hoje.');
    lines.push('');
    lines.push('_Via GitHub Actions — Corridas SP - - by Julio Mishima CTAI)._');
    return lines.join('\n');
  }

  lines.push('Corridas de rua em São Paulo SP hoje:');
  lines.push('');

  const grouped = groupByDateAndCity(unique);
  for (const g of grouped) {
    const dateStr = g.date ? formatDate(g.date, false) : 'Data não informada';
    lines.push(`## ${dateStr}`);
    lines.push('');
    const cityEntries = Object.entries(g.cities).sort(([a], [b]) => a.localeCompare(b));
    for (const [city, cityEvents] of cityEntries) {
      lines.push(`### ${city}`);
      lines.push('');
      lines.push('| Evento | Data | Distâncias | Site | Organizador | Status | Valor da inscrição |');
      lines.push('| --- | --- | --- | --- | --- | --- | --- |');
      for (const e of cityEvents) {
        const dist = (e.distances && e.distances.length) ? e.distances.join(', ') : '-';
        const dateStr = formatDate(e.date, e.hasTime);
        const title = e.link ? `[${escapeMd(e.title)}](${e.link})` : escapeMd(e.title);
        const org = e.organizer ? escapeMd(e.organizer) : '-';
        const status = e.status ? escapeMd(e.status) : '-';
        const priceStr = formatPrice(e.price);
        lines.push(`| ${title} | ${escapeMd(dateStr)} | ${escapeMd(dist)} | ${escapeMd(e.source)} | ${org} | ${status} | ${escapeMd(priceStr)} |`);
      }
      lines.push('');
    }
  }

  lines.push('_Via GitHub Actions — Corridas SP - by Julio Mishima CTAI)._');
  return lines.join('\n');
}

function escapeMd(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

module.exports = { generateReport, generateMarkdown, buildBody, dedupe, formatDate, escapeHtml, groupByDateAndCity, formatPrice };
