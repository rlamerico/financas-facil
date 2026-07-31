# Finanças Fácil

**Finanças Fácil** is a complete, 360° financial management platform designed to replace manual spreadsheets for both personal and small business finances. It features a modern, layered design system (dark mode, glassmorphism) and provides real-time insights into your cash flow, planned vs. actual budgets, and investments.

## ✨ Features

- **Authentication & RBAC:** Secure login with role-based access control (Admin, User, Viewer).
- **Dashboard:** Real-time summary cards with balance evolution sparklines and recent transactions.
- **Transactions Management:** Full CRUD operations for incomes and expenses with categories and pagination.
- **Monthly Budgeting (Planned vs. Actual):** Set financial goals per category and track your actual spending against them in real-time.
- **Investments Tracking:** Manage your asset portfolio with manual price updates and return calculations.
- **Reports & Analytics:** Visual charts for expenses by category and balance evolution, with options to export data to CSV and JSON.
- **Bank Accounts & Calendar:** Manage multiple bank accounts and visualize upcoming bills in a monthly calendar grid.
- **Automations (n8n ready):** Built-in webhook receiver for n8n integrations (e.g., automated bank statement imports or WhatsApp notifications) with an admin-only integration log panel.
- **Google Sheets Sync:** Automatically mirror data from your legacy spreadsheets directly into the database using a custom Google Apps Script.
- **Modern Tech Stack:** Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, and powered by Supabase (PostgreSQL + RLS + Realtime).

---

## 🚀 Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.

### Prerequisites
Before running the project, make sure to copy `.env.example` to `.env.local` and fill in your Supabase keys.

### Running Locally
Run the development server:

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
The page auto-updates as you edit the source files.

## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

> Automatic deploy via GitHub is successfully configured! ✅
