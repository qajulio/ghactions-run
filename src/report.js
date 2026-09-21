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

function buildBody(events) {
  if (!events.length) {
    return '<p>Nenhuma corrida foi encontrada hoje.</p>';
  }
  const rows = events
    .slice()
    .sort((a, b) => (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0))
    .map((e) => {
      const dist = (e.distances && e.distances.length) ? e.distances.join(', ') : '-';
      const dateStr = formatDate(e.date, e.hasTime);
      const extra = e.status ? `<br><strong>Status:</strong> ${escapeHtml(e.status)}` : '';
      const org = e.organizer ? `<br><strong>Organizador:</strong> ${escapeHtml(e.organizer)}` : '';
      const link = e.link ? `<a href="${e.link}">${escapeHtml(e.title)}</a>` : escapeHtml(e.title);
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
          <strong>${link}</strong><br>
          <strong>Data:</strong> ${escapeHtml(dateStr)}<br>
          <strong>Distâncias:</strong> ${escapeHtml(dist)}<br>
          <strong>Site:</strong> ${escapeHtml(e.source)}${org}${extra}
        </td>
      </tr>`;
    })
    .join('\n');
  return `<p>Corridas em São Paulo-SP hoje:</p>
<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
${rows}
</table>
<p style="color:#555;font-size:12px;">Gerado automaticamente via GitHub Actions — <em>Corridas SP - via GIT</em>.</p>`;
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
  lines.push('| Evento | Data | Distâncias | Site | Organizador | Status |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  const sorted = [...unique].sort((a, b) => (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0));
  for (const e of sorted) {
    const dist = (e.distances && e.distances.length) ? e.distances.join(', ') : '-';
    const dateStr = formatDate(e.date, e.hasTime);
    const title = e.link ? `[${escapeMd(e.title)}](${e.link})` : escapeMd(e.title);
    const org = e.organizer ? escapeMd(e.organizer) : '-';
    const status = e.status ? escapeMd(e.status) : '-';
    lines.push(`| ${title} | ${escapeMd(dateStr)} | ${escapeMd(dist)} | ${escapeMd(e.source)} | ${org} | ${status} |`);
  }

  lines.push('');
  lines.push('_Via GitHub Actions — Corridas SP - by Julio Mishima CTAI)._');
  return lines.join('\n');
}

function escapeMd(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

module.exports = { generateReport, generateMarkdown, buildBody, dedupe, formatDate, escapeHtml };
