# Corridas SP (By GIThubActions)

Automação de **corridas em São Paulo capital** em sites esportivos `.kilo/spec.md` para repot de Corridas!
By Julio Mishima (uso interno/pessoal)
---

## Execução local

```bash
npm install
node src/main.js            # busca e gera o relatório em docs/index.html
node src/main.js --dry-run  # apenas lista os eventos encontrados
```

---

## Execução no GitHub Actions (recomendado)

O workflow está em `.github/workflows/send-races.yml` e roda às **8h de São
Paulo, de segunda a sexta** (`cron: '0 11 * * 1-5'`), além de ser disparável
manualmente via `workflow_dispatch`.


## Notas

- O relatório HTML é salvo em `docs/index.html` e publicado via GitHub Pages
  usando `peaceiris/actions-gh-pages`.
- Eventos sem data válida são mantidos mas ordenados ao final.
- By Julio Mishima (uso interno/pessoal)
