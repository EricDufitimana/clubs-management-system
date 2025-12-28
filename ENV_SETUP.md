# Environment Variables Setup

Create a `.env` file in the root of the project with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clubsdb"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Node Environment
NODE_ENV="development"
```

## Setup Instructions

1. **Database (PostgreSQL)**
   - Set up a PostgreSQL database
   - Update `DATABASE_URL` with your connection string
   - Run: `npx prisma generate && npx prisma db push`

2. **Supabase**
   - Create a Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. **NextAuth**
   - Generate a secret: `openssl rand -base64 32`
   - Update `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` with your domain (use http://localhost:3000 for local dev)

4. **Resend (Email)**
   - Sign up at https://resend.com
   - Get your API key
   - Update `RESEND_API_KEY`

## After Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Visit http://localhost:3000 to see the landing page and http://localhost:3000/dashboard for the dashboard.

