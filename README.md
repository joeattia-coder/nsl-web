# NSL Monorepo

This repository is now organized as a workspace so the existing Next.js web app can stay stable while mobile and shared packages are added alongside it.

## Current Apps

- `apps/web`: the current Next.js web application

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Run the web app from the repository root:

```bash
npm run dev
```

Useful root scripts:

```bash
npm run dev:web
npm run build:web
npm run lint:web
npm run seed:web
```

## Password Reset Email Setup

The web app can send real password reset emails over SMTP. Configure these variables for `apps/web`:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_FROM_NAME="National Snooker League"
SMTP_REPLY_TO=support@example.com
APP_URL=http://localhost:3000
```

If SMTP is not configured, the reset flow falls back to returning the reset link in local development only.

## Why This Layout

This workspace structure lets us add:

- `apps/mobile` for Expo React Native
- `packages/shared` for shared types and helpers
- `packages/api` for shared client-side API utilities

without changing the behavior of the existing web app.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
