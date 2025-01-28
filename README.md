# nicholasdly/auth

> Examples of implementing your own authentication and authorization systems in Next.js.

I grew tired of doing the same setup for authentication and authorization over and over again every time I start a new project. I created this repository as a collection of examples that can basically be copy-and-paste'd into a project.

Most of this codebase is sourced from [Lucia](https://lucia-auth.com/)'s example projects, with minor changes and an updated user interface to use tools that I more commonly use.

The concepts used in these examples are not completely specific to [Next.js](https://nextjs.org/) or [PostgreSQL](https://www.postgresql.org/), since the core auth principles apply to all frameworks and stacks. For a more general guideline on implementing auth in web applications, I highly recommend [The Copenhagen Book](https://thecopenhagenbook.com/).

## Development

**nicholasdly/auth** is built with the following tools:

- **Web Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)

### Installation

1. Fork and clone this repository using `git clone`.

2. Install npm packages:

```zsh
npm install
```

3. Create a `.env.local` file based off of [`.env.example`](.env.example), and provide the necessary keys. I'm using a [Neon](https://neon.tech/) Postgres database, so if you are using a different kind of database be sure to update the [schema](src/db/schema.ts) and migrations.

4. Run the database migrations.

```zsh
npm run db:migrate
```

5. Run the following command to start a local development server.

```zsh
npm run dev
```

## License

Licensed under the MIT License, Copyright © 2025
