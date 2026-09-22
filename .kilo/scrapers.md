# Scrapers de Corridas

## Visão Geral

Os scrapers coletam eventos de corridas de rua em São Paulo a partir de sites parceiros. Cada scraper é uma função assíncrona que retorna uma lista de eventos normalizados.

Arquivo principal: `src/scrapers.js` (unifica todos os scrapers em um único módulo).

---

## Scrappers Ativos

### 1. Iguana Sports (`iguanasports.com.br`)

| Campo | Valor |
|-------|-------|
| URL Calendário | `https://iguanasports.com.br/blogs/calendario-corridas-de-rua` |
| Estratégia | HTML Scraping (Cheerio) |
| Fonte | `iguanasports.com.br` |
| Organizador padrão | `Iguana Sports` |
| Tempo disponível | ✅ Sim |

**Seletores CSS:**
- Container: `.item-article-blog`
- Card: `.article-card`
- Título: `.article-card__title a .text` ou `.article-card__title`
- Data: `.article-card__running-date .text`

**Filtragem:**
- Localização: match por `São Paulo | SP` (atributo `data-localization` ou texto do pin)

**Campos do evento retornado:**
```js
{
  title: string,
  slug: string,
  date: Date | null,
  dateText: string,
  distances: string[],
  link: string,
  organizer: 'Iguana Sports',
  source: 'iguanasports.com.br',
  hasTime: true,
}
```

---

### 2. Ticket Sports (`ticketsports.com.br`)

| Campo | Valor |
|-------|-------|
| URL API | `https://www.ticketsports.com.br/api/events/list` |
| Estratégia | API REST (GET com query params) |
| Fonte | `ticketsports.com.br` |
| Tempo disponível | ❌ Não |

**Parâmetros da requisição:**
- `country=Brasil`
- `state=São Paulo`
- `city=São Paulo`
- `period=0`

**Filtragem:**
- Endereço: match por `São Paulo, SP`
- Palavras-chave excluídas: `mtb`, `mountain bike`, `triatlo`, `triatlon`, `aquabike`, `duatlo`, `ciclismo`, `bmx`, `velocross`, `skate`, `patins`

**Campos do evento retornado:**
```js
{
  title: string,
  date: Date | null,
  dateText: string,
  distances: [],
  link: string,
  organizer: string,
  source: 'ticketsports.com.br',
  status: string,
  price: number | null,
  fullPrice: number | null,
  signUpDeadLine: string,
  hasTime: false,
}
```

---

## Orquestrador (`scrapeAll`)

Executa todos os scrapers em paralelo via `Promise.all`. Cada resultado retornado tem a forma:

```js
{
  source: string,      // Nome do site
  events: Event[],     // Lista de eventos encontrados
  error: string | null // Mensagem de erro, se houver
}
```

Em caso de erro em qualquer scraper, os demais continuam executando.

---

## Como Adicionar um Novo Scraper

1. Crie uma função assíncrona que retorne `Event[]`
2. Adicione à array `SCRAPERS` no topo do arquivo:

```js
const SCRAPERS = [
  { scrape: iguanaScrape, SOURCE_NAME: 'iguanasports.com.br' },
  { scrape: ticketsportsScrape, SOURCE_NAME: 'ticketsports.com.br' },
  { scrape: meuNovoScrape, SOURCE_NAME: 'exemplo.com.br' },  // novo
];
```

3. O `scrapeAll` automaticamente incluirá o novo scraper.

---

## Estrutura de Dados Normalizada (Event)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | `string` | Nome do evento |
| `slug` | `string` | Identificador amigável (quando disponível) |
| `date` | `Date \| null` | Data/hora do evento |
| `dateText` | `string` | Data original do site |
| `distances` | `string[]` | Distâncias oferecidas (ex: `['5k', '10k']`) |
| `link` | `string` | URL absoluta para inscrição |
| `organizer` | `string` | Nome do organizador |
| `source` | `string` | Domínio da fonte |
| `status` | `string` | Status do evento (Ticket Sports) |
| `price` | `number \| null` | Preço (Ticket Sports) |
| `fullPrice` | `number \| null` | Preço cheio (Ticket Sports) |
| `signUpDeadLine` | `string` | Prazo de inscrição (Ticket Sports) |
| `hasTime` | `boolean` | Se o evento informa horário |
