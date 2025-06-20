# Nauw - Appointment Booking Platform

A modern appointment booking platform for Swiss service businesses, built with Next.js and Supabase.

## Features

- 🏢 **Business Portal**: Complete management system for services, employees, and schedules
- 📅 **Smart Booking**: Intelligent availability calculation with buffer times
- 📱 **Mobile-First**: Responsive design that works on all devices
- 🇨🇭 **Swiss-Optimized**: Built for Swiss business needs (CHF, +41 phone format, postal codes)
- 🎨 **Customizable**: Businesses can customize their booking page appearance
- 🔒 **Secure**: Row-level security with Supabase Auth

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hedingerm/nauw.git
cd nauw
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Set up the database:
   - Run the SQL scripts in `scripts/setup-database.sql` in your Supabase SQL editor
   - Apply any migrations in `scripts/migrations/`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hedingerm/nauw)

1. Click the "Deploy" button above
2. Connect your GitHub repository
3. Add your environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (business)/        # Business portal routes
│   └── (customer)/        # Customer booking routes
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── features/         # Feature-specific components
├── lib/                  # Shared utilities
│   ├── auth/            # Authentication utilities
│   ├── schemas/         # Zod schemas
│   ├── services/        # Service layer (business logic)
│   ├── supabase/        # Supabase client and types
│   └── utils/           # Helper functions
└── hooks/               # Custom React hooks
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact support@nauw.ch