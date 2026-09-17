pnpm init

pnpm add fastify @fastify/jwt @fastify/cors @fastify/swagger @fastify/swagger-ui drizzle-orm pg zod bcrypt dotenv

pnpm add -D typescript tsx @types/node @types/pg @types/bcrypt drizzle-kit

pnpm exec tsc --init

mkdir src

New-Item src/index.ts -ItemType File

New-Item .env -ItemType File

New-Item .gitignore -ItemType File

New-Item .env.example -ItemType File

mkdir src\db
mkdir src\db\schema
mkdir src\db\migrations

New-Item -ItemType Directory -Path .\src\db\seed -Force; New-Item -ItemType File -Path .\src\db\seed\index.ts -Force

New-Item -ItemType Directory -Force -Path `.\src\config,`
.\src\plugins, `.\src\middleware,`
.\src\utils, `.\src\types,`
.\src\modules, `.\src\modules\auth,`
.\src\modules\users, `.\src\modules\roles,`
.\src\modules\permissions, `.\src\modules\organizations,`
.\src\modules\sites, `.\src\modules\departments,`
.\src\modules\storage-areas, `.\src\modules\storage-units,`
.\src\modules\item-categories, `.\src\modules\units-of-measure,`
.\src\modules\items, `.\src\modules\vendors,`
.\src\modules\assets, `.\src\modules\inventory,`
.\src\modules\stock-transactions, `.\src\modules\assignments,`
.\src\modules\transfers, `.\src\modules\returns,`
.\src\modules\maintenance, `.\src\modules\disposals,`
.\src\modules\audit-logs, `
.\src\modules\notifications

New-Item -ItemType File -Path .\src\app.ts -Force

New-Item -ItemType File -Path .\src\plugins\cors.ts,.\src\plugins\jwt.ts,.\src\plugins\swagger.ts -Force

New-Item -ItemType File -Path .\src\modules\auth\auth.route.ts,.\src\modules\auth\auth.service.ts,.\src\modules\auth\auth.schema.ts -Force

pnpm add fastify-type-provider-zod

New-Item -ItemType File -Path .\src\types\fastify.d.ts -Force
pnpm add fastify-plugin