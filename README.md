# E-Plano

Aplicacao React/Vite com API Express e banco Supabase. Frontend e API sao
publicados juntos na Vercel; nao e necessario manter um backend no Render.

## Desenvolvimento local

1. Instale as dependencias na raiz com `npm install`.
2. Copie `.env.example` para `backend/.env` e preencha as credenciais.
3. Execute `npm run dev` para iniciar a API e o frontend juntos.

No desenvolvimento, o Vite monta a API Express no caminho `/api`. Frontend e
API usam um unico processo e ficam disponíveis em `http://localhost:5173`.

## Deploy na Vercel

Importe este repositorio na Vercel e cadastre estas variaveis no projeto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL` (opcional, para um dominio adicional)

Nao configure `VITE_API_URL` em producao. Sem essa variavel, o frontend usa
`/api` no proprio dominio. O arquivo `server.js` da raiz exporta o Express para
uma funcao serverless e tambem entrega o build do Vite. A verificacao da API
fica disponivel em `/api/health`.

O comando de build e `npm run vercel-build`. Nenhuma configuracao do Render e
necessaria.

## Seguranca

Arquivos `.env` nao devem ser versionados. Se alguma chave real ja tiver sido
enviada ao repositorio, rotacione-a no Supabase e substitua tambem `JWT_SECRET`.
