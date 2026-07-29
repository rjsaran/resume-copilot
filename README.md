# Resume Copilot

Resume Copilot helps you tailor your resume and cover letter to a specific job description, track the resulting application, and manage your whole job search from one place.

Point it at a job posting and it will:

- **Analyze the fit** — score how well your resume matches the job description, surface covered/missing requirements, and highlight strengths and gaps.
- **Tailor a resume** — generate a version of your resume adjusted for that job, with a diff view against your master resume so you can see exactly what changed.
- **Draft a cover letter** — generate and edit a cover letter for the application.
- **Export to PDF** — download the tailored resume and cover letter as polished PDFs.
- **Track applications** — keep a board/table of applications with status, job description, and generated documents attached.
- **Build a master resume** — maintain a personal knowledge base and generate a master resume from it on the fly.

Bring your own LLM API key (Google Gemini or OpenRouter today) — each user's key is encrypted at rest and used only for their own requests.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Postgres via [Drizzle ORM](https://orm.drizzle.team) (works with [Neon](https://neon.tech) or any Postgres-compatible database)
- [Supabase](https://supabase.com) for authentication (Google OAuth)
- Tailwind CSS + shadcn/ui components
- Playwright + `@sparticuz/chromium` for server-side PDF rendering

> **Note:** this project pins Next.js/React versions that may include breaking changes ahead of their stable public APIs — see [AGENTS.md](./AGENTS.md).

## Getting started

### Prerequisites

- Node.js 20+
- A Postgres database (e.g. a free [Neon](https://neon.tech) project)
- A [Supabase](https://supabase.com) project (for auth) with Google OAuth configured
- An API key for at least one supported LLM provider ([Google Gemini](https://aistudio.google.com/apikey) or [OpenRouter](https://openrouter.ai/keys))

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/rjsaran/resume-copilot.git
   cd resume-copilot
   npm install
   ```

2. Copy the env template and fill in your own values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, keep secret) |
   | `ENCRYPTION_KEY` | Random 32+ byte secret used to encrypt each user's LLM API key at rest — generate with `openssl rand -base64 32` |
   | `LOG_LEVEL` | Optional. `debug` \| `info` \| `warn` \| `error` |

3. Push the schema to your database:

   ```bash
   npm run db:push
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then add your LLM API key under **Settings**.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | Lint the codebase |
| `npm run db:push` | Push the Drizzle schema to `DATABASE_URL` (from `.env`/`.env.local`) |
| `npm run db:push:prod` | Push the schema using `.env.production` |

## Deployment

The app is set up to deploy on [Vercel](https://vercel.com) — see `vercel.json` for the PDF export route's function configuration. Any Node.js host that supports Next.js should work; just make sure the environment variables above are set.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get set up and submit changes.

## License

[MIT](./LICENSE)
