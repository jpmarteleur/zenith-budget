# Zenith Budget 

A personalized budgeting application built with modern web technologies, designed with all the features I always wanted in budgeting apps but could never find in one place.

---

## Objective

This project was created to build a full-stack application that addresses my personal budgeting needs. It combines intuitive transaction tracking, AI-powered expense parsing, monthly planning, and customizable subcategories into a single, cohesive tool.

---

## Why

I wanted a budgeting app that truly worked the way I think about money—with flexibility, clarity, and powerful features like AI transaction parsing. Instead of settling for existing solutions that only partially fit my workflow, I built exactly what I needed while learning full-stack development.

---

## How It Works

The application is built with:
- **Frontend**: React + TypeScript + Vite for a fast, type-safe UI
- **Backend**: Supabase for authentication and database management
- **AI Integration**: Google Gemini API for intelligent transaction parsing
- **Styling**: Tailwind utilities with Inter/Lora typography and category colors

Users create monthly budgets and see Remaining to allocate and Remaining to spend (recorded cash flow) together, with category progress and allocation editing in one view. Expand any of the six categories to add subcategories or edit existing allocations, including deleting or excluding subcategories from totals while retaining transaction history.

Open the month dropdown and choose **Create new month** at the top to copy another month’s plan, reset planned amounts while keeping subcategories, or start from scratch. Copying does not copy historical transactions or overwrite an existing month. Use Quick entry for AI suggestions followed by an editable review, or Manual to enter the details directly. Transaction history appears below the categories, grouped by day with editing and confirmed deletion. Dates stay within the selected budget month. A recurring counter includes upcoming and due entries not yet recorded for that month; Review shows upcoming dates and amounts and links to rule management. Automatic application still waits until entries are due. Failed saves preserve your inputs; an uncertain server response asks you to reload activity before retrying. Settings shows currency and account/sign out directly, with expandable sections for recurring transaction rules and help and budget setup. Currency selection does not convert amounts between currencies.

---

## Try It Out

Follow the link https://zenith-budget.vercel.app/

If you encounter any bugs or have feature suggestions, please open an issue or submit a pull request. Contributions and feedback are always welcome!

---

## Future Plans

- Implement budget forecasting and predictions
- Build year-over-year comparison views

---

## What I Learned

Throughout this project I built comprehensive full-stack development skills:

- **Backend integration**: Working with Supabase for authentication, database operations, real-time subscriptions, and secure API endpoints.
- **API design**: Creating serverless functions, handling requests/responses, error handling, and integrating third-party APIs (Google Gemini).
- **Data visualization**: Implementing interactive charts with Recharts, transforming raw data into meaningful visual insights.
- **TypeScript proficiency**: Defining complex types and interfaces, type guards, generic types, and leveraging the type system for safer code.
- **UI/UX design**: Creating an intuitive interface, responsive layouts, modal patterns, form validation, and consistent visual feedback.
- **Authentication flows**: Implementing secure user authentication, session management, and protected routes.
- **Database design**: Structuring relational data, writing efficient queries, and managing user-specific data isolation.
- **AI integration**: Prompt engineering for transaction parsing, handling API responses, and fallback strategies for AI failures.
- **Problem-solving**: Breaking down complex features, debugging across the stack, and iterating based on real-world usage.

---

## Key Features

- **Track and Plan**: Recorded activity, category progress, expected income, and monthly allocations
- **AI Transaction Parsing**: Natural language expense input powered by Google Gemini
- **Multi-Month Management**: Track budgets across different time periods
- **Customizable Subcategories**: Manage your own items within six budget categories
- **Recurring Transactions**: Add, edit, pause, or delete monthly rules in Settings. Review due items and amount overrides in month setup or Budget. Due rules are also applied to an existing current-month budget while using the app. Rule changes keep historical transactions; failures retain inputs or ask you to reload when a write cannot be confirmed
- **Secure Authentication**: User accounts with Supabase Auth
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Guest Mode**: Try the app with local data kept separate from signed-in budgets

---

