# E-Plano

Aplicacao React/Vite com API Express e banco Supabase. Frontend e API sao
publicados juntos como uma aplicacao Node.js; nao e necessario usar o Render.

## Desenvolvimento local

1. Instale as dependencias na raiz com `npm install`.
2. Copie `.env.example` para `backend/.env` e preencha as credenciais.
3. Execute `npm run dev` para iniciar a API e o frontend juntos.

No desenvolvimento, o Vite monta a API Express no caminho `/api`. Frontend e
API usam um unico processo e ficam disponíveis em `http://localhost:5173`.

## Deploy na Hostinger

Crie uma **Node.js Web App** na Hostinger e use:

- Preset: `Express.js`
- Versao do Node.js: `22.x`
- Build command: `npm run build`
- Start command: `npm start`
- Entry file: `server.js`

Cadastre estas variaveis no painel da aplicacao:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL` (opcional, para um dominio adicional)
- `SUPABASE_KEEP_ALIVE_HOURS` (opcional; o padrao e 24 horas)

Nao configure `VITE_API_URL` em producao. Sem essa variavel, o frontend usa
`/api` no proprio dominio. O arquivo `server.js` entrega o build do Vite e a
API Express no mesmo processo. A verificacao fica em `/api/health`.

Enquanto o processo Node estiver ativo, ele faz uma consulta minima ao Supabase
ao iniciar e a cada 24 horas. Isso mantem atividade regular no banco e evita a
pausa por inatividade. O intervalo pode ser alterado com
`SUPABASE_KEEP_ALIVE_HOURS`.

Nenhuma configuracao do Render e necessaria.

## Seguranca

Arquivos `.env` nao devem ser versionados. Se alguma chave real ja tiver sido
enviada ao repositorio, rotacione-a no Supabase e substitua tambem `JWT_SECRET`.
