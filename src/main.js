const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { scrapeAll } = require('./scrapers');
const { generateReport, generateMarkdown, dedupe } = require('./report');

const REPORT_DIR = path.join(__dirname, '..', 'docs');
const REPORT_PATH = path.join(REPORT_DIR, 'index.html');
const MD_PATH = path.join(REPORT_DIR, 'index.md');

function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('Coletando corridas de rua em São Paulo capital...');
  const results = await scrapeAll();

  const events = [];
  for (const res of results) {
    if (res.error) {
      console.error(`[${res.source}] erro: ${res.error}`);
    } else {
      console.log(`[${res.source}] ${res.events.length} evento(s) encontrado(s)`);
    }
    res.events.forEach((e) => events.push(e));
  }

  const unique = dedupe(events);
  unique.sort((a, b) => (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0));

  console.log(`Total único após deduplicação: ${unique.length}`);

  const html = generateReport(unique);

  if (dryRun) {
    console.log('\n=== RELATÓRIO GERADO ===');
    console.log(html);
    return;
  }

  ensureReportDir();
  fs.writeFileSync(REPORT_PATH, html, 'utf-8');
  console.log(`Relatório HTML salvo em: ${REPORT_PATH}`);

  const md = generateMarkdown(unique);
  fs.writeFileSync(MD_PATH, md, 'utf-8');
  console.log(`Relatório Markdown salvo em: ${MD_PATH}`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
