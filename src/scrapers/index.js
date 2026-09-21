const iguana = require('./iguana');
const ticketsports = require('./ticketsports');

const SCRAPERS = [iguana, ticketsports];

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
