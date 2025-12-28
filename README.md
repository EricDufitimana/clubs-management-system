# Awake Agency + Clubs Management System

This project combines the beautiful Awake Agency landing page with a full-featured Clubs Management System dashboard.

## 🎯 What's Inside

### Landing Page (Awake Agency)
- Modern, responsive landing page
- Beautiful UI with dark mode support
- Contact forms and documentation pages
- Built with Next.js 16 and Tailwind CSS v4

### Dashboard (Clubs Management System)
- Complete club management system
- Admin, Super Admin, and User dashboards
- Member management and attendance tracking
- Session and event management
- Analytics and reporting
- Role-based access control
- Email invitations with Resend
- Built with Next.js 16, Prisma, tRPC, and Material-UI

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory. See `ENV_SETUP.md` for details.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Your app URL
- `RESEND_API_KEY` - Resend API key for emails

### 3. Set Up Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Visit:
- Landing page: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## 📁 Project Structure

```
src/
├── app/
│   ├── (site)/              # Landing page routes
│   ├── dashboard/           # Dashboard routes
│   ├── api/                 # API routes
│   ├── components/          # React components
│   └── globals.css          # Global styles (Tailwind v4)
├── sections/                # Dashboard sections
├── layouts/                 # Layout components
├── lib/                     # Utilities (Prisma, auth, etc.)
├── hooks/                   # Custom React hooks
├── contexts/                # React contexts
├── actions/                 # Server actions
├── theme/                   # MUI theme configuration
├── trpc/                    # tRPC setup
└── utils/                   # Utility functions

prisma/
└── schema.prisma           # Database schema

public/
├── images/                 # Landing page images
└── assets/                 # Dashboard assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS v4** - Utility-first CSS
- **Material-UI (MUI)** - Component library for dashboard
- **Framer Motion** - Animations
- **ApexCharts** - Data visualization

### Backend
- **Prisma** - ORM for database
- **tRPC** - Type-safe API
- **NextAuth** - Authentication
- **Supabase** - Backend services
- **Resend** - Email service

### Development
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Turbopack** - Fast development builds

## 📖 Documentation

- `MIGRATION_NOTES.md` - Detailed migration information
- `ENV_SETUP.md` - Environment variable setup guide
- `TROUBLESHOOTING.md` - Common issues and solutions

## 🎨 Features

### Landing Page
- Hero section with animations
- Services showcase
- Customer testimonials
- Pricing plans
- Contact form
- Dark/Light mode toggle

### Dashboard
- **Multi-role support**: Super Admin, Admin, User
- **Club Management**: Create, edit, activate/deactivate clubs
- **Member Management**: Add members, track status
- **Session Management**: Create events, track attendance
- **Analytics**: View reports and statistics
- **Invite System**: Email invitations with tokens
- **Responsive Design**: Works on all devices

## 🔒 Authentication

The system uses NextAuth with role-based access control:
- **Super Admin**: Full system access
- **Admin**: Club-level management
- **User**: Basic club access

## 🗄️ Database

PostgreSQL database managed with Prisma ORM. Schema includes:
- Users and authentication
- Clubs and memberships
- Sessions and attendance
- Invitations and tokens
- Audit logs

## 📧 Email System

Transactional emails via Resend API:
- Club invitations
- Welcome emails
- Password resets (if implemented)

## 🎯 Roadmap

- [ ] Add more dashboard analytics
- [ ] Implement real-time notifications
- [ ] Add file upload for member photos
- [ ] Export reports to PDF/Excel
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📝 License

Proprietary - All rights reserved

## 🆘 Need Help?

1. Check `TROUBLESHOOTING.md` for common issues
2. Review the documentation files
3. Check the console for error messages
4. Verify environment variables are correct

---

Built with ❤️ using Next.js, Tailwind CSS v4, and Material-UI

