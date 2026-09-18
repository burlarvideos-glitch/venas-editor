# Venas PDF Editor

Editor de PDF executado no navegador.

## Estrutura

- `index.html` — aplicação
- `netlify.toml` — configuração de publicação no Netlify
- `.gitignore` — arquivos ignorados pelo Git

## Publicação

Este projeto é estático. Não precisa de Node.js, Python ou servidor próprio para a publicação.

No Netlify:
1. Add new project
2. Import an existing project
3. GitHub
4. Selecione `venas-pdf-editor`
5. Publish directory: `.`
6. Sem Build command
7. Deploy

As bibliotecas PDF.js e pdf-lib são carregadas pelo navegador a partir de CDNs HTTPS.

## Objetivo da aplicação

Permitir carregar um PDF, selecionar textos detectados e editar o conteúdo textual no navegador. A exportação tenta alterar o fluxo de conteúdo do PDF em vez de simplesmente desenhar uma tarja sobre o texto original.

> Observação: PDFs usam estruturas, fontes e codificações diferentes. A edição estrutural precisa ser validada com PDFs reais, incluindo o PDF de teste do projeto.
