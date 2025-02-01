# Next.js Auth Starter

This is a starter template for rolling your own auth using **Next.js**. This template is intentionally minimal and to be used as a learning resource. The general concepts implemented in this codebase can be applied anywhere, not just Next.js.

You can learn more about rolling your own auth here:

- [The Copenhagen Book](https://thecopenhagenbook.com/)
- [Lucia](https://lucia-auth.com/)

**Demo: [https://next-auth-start.vercel.app/](https://next-auth-start.vercel.app/)**

## Features

- Control every step of the authentication process and own all of your data
- Fully type-safe
- Database sessions
- Credentials login (email/username + password)
- Email code verification
- Powered by high performance, zero third-party dependent packages:
  - Award winning password hashing via `@node-rs/argon2`
  - Cryptographically secure random generation via `@oslojs/crypto`
  - SHA-256 hashing, ensuring token security during a database leak, via `@oslojs/encoding`

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Email**: [Resend](https://resend.com/)

## Getting Started

```bash
git clone https://github.com/nicholasdly/next-auth-starter.git
cd next-auth-starter
npm install
```

## Running Locally

Create and populate your `.env.local` file based off of the `.env.example` file.

```bash
DATABASE_URL=***
UPSTASH_REDIS_REST_URL=***
UPSTASH_REDIS_REST_TOKEN=***
RESEND_API_KEY=***
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
