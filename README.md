# Next.js Auth Starter

This is a starter template for rolling your own auth using **Next.js**. This template is intentionally minimal and to be used as a learning resource. The general concepts implemented in this codebase can be applied anywhere, not just Next.js.

You can learn more about rolling your own auth here:

- [The Copenhagen Book](https://thecopenhagenbook.com/)
- [Lucia](https://lucia-auth.com/).

**Demo: [https://next-auth-start.vercel.app/](https://next-auth-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nicholasdly/next-auth-starter.git
cd saas-starter
pnpm install
```

## Running Locally

Create and populate your `.env.local` file based off of the `.env.example` file.

```bash
DATABASE_URL=***
UPSTASH_REDIS_REST_URL=***
UPSTASH_REDIS_REST_TOKEN=***
```

Then run your database migrations:

```bash
npm run db:migrate
```

Finally, run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## License

Licensed under the MIT License, Copyright © 2025
