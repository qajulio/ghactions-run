# Corridas SP (By GIThubActions)

Automação de **corridas em São Paulo capital** em sites esportivos para repot de Corridas!
By Julio Mishima (uso interno/pessoal)
---

## Execução no GitHub Actions

O workflow em `.github/workflows/send-races.yml` e roda às **8h de São
Paulo, de segunda a sexta**


## Notas

- O relatório HTML é salvo em `docs/index.html` e publicado via GitHub Pages
  usando `peaceiris/actions-gh-pages`.
- Eventos sem data válida são mantidos mas ordenados ao final.
- By Julio Mishima (uso interno/pessoal)
