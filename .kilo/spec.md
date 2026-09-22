# Specificação - Corridas SP

## Sites de Corrida

| # | Nome | URL | URL Calendário | Estratégia | Ativo |
|---|------|-----|----------------|------------|-------|
| 1 | **Iguana Sports** | <https://iguanasports.com.br/> | <https://iguanasports.com.br/blogs/calendario-corridas-de-rua> | HTML Scraping | ✅ |
| 2 | **Ticket Sports** | <https://www.ticketsports.com.br/> | API: `https://www.ticketsports.com.br/api/events/list?country=Brasil&state=São Paulo&city=São Paulo` | API | ✅ |
| 3 | **Ativo.com / Running Land** | <https://www.ativo.com/> | <https://www.ativo.com/calendario> | HTML Scraping | ❌ |
| 4 | **Pace5** | <https://pace5.com.br/> | <https://pace5.com.br/calendario> | HTML Scraping | ❌ |
| 5 | **Running Life** | <https://running.life/calendario-corridas/brasil> | <https://running.life/calendario-corridas/brasil> | HTML Scraping | ❌ |
| 6 | **Sports Nation** | <https://www.sportsnation.com.br/> | <https://www.sportsnation.com.br/calendario> | HTML Scraping | ❌ |
| 7 | **Runners Brasil** | <https://calendario.runnersbrasil.com/> | <https://calendario.runnersbrasil.com/> | HTML Scraping | ❌ |
| 8 | **Corrida360º** | <https://corrida360.com.br/corridas> | <https://corrida360.com.br/corridas> | HTML Scraping | ❌ |
| 9 | **Só Corridas** | <https://socorridas.com.br/> | <https://socorridas.com.br/calendario> | HTML Scraping | ❌ |
| 10 | **Baixa Pace** | <https://www.baixapace.com.br/calendario-de-corridas/> | <https://www.baixapace.com.br/calendario-de-corridas/> | HTML Scraping | ❌ |
| 11 | **Esportividade** | <https://esportividade.com.br/> | <https://esportividade.com.br/calendario> | HTML Scraping | ❌ |

---

## Configurações de Locale

| Configuração | Valor |
|--------------|-------|
| País | Brasil |
| Estado | São Paulo |
| Cidade | São Paulo |
| Idioma | pt-BR |
| Timezone | America/Sao_Paulo |
| UTC Offset | -03:00 |
| Formato de Data | DD/MM/YYYY |
| Formato de Hora | HH:mm |

---

## Filtros

### Localização Alvo
- **Cidade**: São Paulo
- **Estado**: São Paulo
- **País**: Brasil

### Palavras-chave para Incluir
- corrida
- running 5 e/ou 10k e/ou 15k, e/ou 30k
- maratona 42k
- meia maratona 21k


### Palavras-chave para Excluir
- virtual
- online
- treino
- kids
- infantil
- corridas modalidade infantil
- corridas com cachorro

---

## Agendamento

| Configuração | Valor |
|--------------|-------|
| Cron (UTC) | `0 11 * * 1-5` |
| Descrição | Segunda a sexta, 8h de São Paulo (UTC-3) |
| Timezone | America/Sao_Paulo |
| Habilitado | ✅ |

---

## E-mail

| Configuração | Valor |
|--------------|-------|
| Assunto | `Corridas SP - via GIT - {{date}}` |
| Remetente via Git Email | ✅ |
| Modo Dry-run | ❌ |

---

## Deduplicação

| Configuração | Valor |
|--------------|-------|
| Habilitado | ✅ |
| Chaves | title, date, location |
| Threshold de Similaridade | 0.85 |

---

## Configurações de Scraping

| Configuração | Valor |
|--------------|-------|
| Timeout | 30000 ms |
| User Agent | `Mozilla/5.0 (compatible; CorridasSP/1.0; +https://github.com)` |
| Tentativas | 3 |
| Delay entre tentativas | 2000 ms |
| Rate Limit | 1000 ms |