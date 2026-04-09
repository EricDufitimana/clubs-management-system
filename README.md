# Clubs Management System

A modern web application combining a beautiful landing page with a comprehensive clubs management dashboard.

## 🌟 Features

### Landing Page
- Modern, responsive design with dark mode support
- User authentication (Sign In/Sign Up)
- Theme toggle and smooth animations
- Built with Next.js 16 and Tailwind CSS

### Dashboard System
- **Multi-role Access**: Super Admin, Admin, and User roles
- **Club Management**: Create, edit, and manage clubs
- **Member Management**: Add members, track attendance, manage status
- **Session Management**: Create and manage club sessions
- **Analytics**: Reports and attendance insights
- **Email System**: Member invitations via Resend
- **Left Members**: Separate view for former members

## � Key Features

### Member Management
- Add/remove members from clubs
- Track member status (active/left)
- Attendance tracking
- Member profiles with avatars

### Club Administration
- Create and manage clubs
- Club-specific member lists
- Session scheduling
- Analytics per club

### Super Admin Features
- View all clubs and members
- System-wide analytics
- Left members management
- User role management

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS, Material-UI
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Email**: Resend
- **State Management**: React Query (TanStack Query)

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

