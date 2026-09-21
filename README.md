# Corridas SP - via GIT

Automação que busca **corridas de rua em São Paulo capital** nas fontes
listadas em `.kilo/spec.md` e gera um relatório HTML publicado via
**GitHub Pages**.

---

## Como funciona

1. **Scrapers** buscam eventos nas fontes listadas em `.kilo/spec.md`
   (HTML renderizado e API pública).
2. Os eventos são **filtrados para São Paulo capital** e deduplicados.
3. Um relatório HTML é gerado e publicado automaticamente no **GitHub Pages**.

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

### 1. Tornar o repositório private (recomendado)

```bash
# Na máquina local:
git init
git add .
git commit -m "Automação corridas SP - via GIT"
git branch -M main
git remote add origin git@github.com:qajulio/qa-github-actions.git
git push -u origin main
```

Depois, no GitHub: **Settings → General → Danger Zone → Change visibility**
para marcar o repositório como **private**.

### 2. Publicar no GitHub Pages

Com o workflow no branch `main`, o relatório é gerado e publicado automaticamente
na branch `gh-pages` a cada execução. O GitHub Pages ficará disponível em:

```
https://<usuário>.github.io/<repositório>/
```

### 3. Agendar

Com o workflow no branch `main`, a geração e publicação ocorrem automaticamente
na agenda definida.

---

## Notas

- O relatório HTML é salvo em `docs/index.html` e publicado via GitHub Pages
  usando `peaceiris/actions-gh-pages`.
- Eventos sem data válida são mantidos mas ordenados ao final.
