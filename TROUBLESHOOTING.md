# Known Issues & Solutions

## Potential Issues After Migration

### 1. Missing CSS Variables

**Issue**: Components might reference CSS variables that don't exist in Tailwind v4.

**Solution**: All MUI theme CSS variables have been added to `globals.css`. If you see any missing variables, add them to the `:root` section at the bottom of `globals.css`.

### 2. Tailwind Class Not Working

**Issue**: Some Tailwind classes might not work as expected.

**Solution**: 
- Most v3 classes work in v4
- Check if the class uses color opacity (e.g., `bg-blue-500/50`)
- Refer to Tailwind v4 docs: https://tailwindcss.com/docs/v4-beta

### 3. Import Path Errors

**Issue**: TypeScript errors about module imports.

**Solution**: Update `tsconfig.json` paths if needed. Current paths should include:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4. Prisma Client Not Generated

**Issue**: `@prisma/client` module not found.

**Solution**:
```bash
npx prisma generate
```

### 5. Database Connection Issues

**Issue**: Cannot connect to database.

**Solution**:
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Test connection: `npx prisma db push`

### 6. Supabase Errors

**Issue**: Supabase client errors.

**Solution**:
- Verify Supabase environment variables
- Check that keys are correctly copied from Supabase dashboard
- Ensure URL includes `https://`

### 7. NextAuth Session Issues

**Issue**: Authentication not working.

**Solution**:
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### 8. Email Not Sending

**Issue**: Invite emails not being sent.

**Solution**:
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for API limits
- Verify Supabase edge function is deployed (check edge functions in Supabase)

### 9. MUI Styles Not Loading

**Issue**: Material-UI components look unstyled.

**Solution**:
- Ensure font imports in `globals.css` are working
- Check that MUI CSS variables are defined in `:root`
- Verify `@emotion/react` and `@emotion/styled` are installed

### 10. Build Errors

**Issue**: Next.js build fails.

**Solution**:
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Compatibility Notes

### Tailwind v4 vs v3

The main differences:
- Configuration is now in CSS (`@theme`) instead of JS config file
- `@import 'tailwindcss'` instead of `@tailwind` directives
- Most utility classes work identically
- Custom plugins use `@plugin` directive in CSS

### Next.js 16

This project uses Next.js 16 with:
- App Router (not Pages Router)
- React Server Components
- Server Actions
- Turbopack (in development)

### React 19

Using React 19 which includes:
- New hooks and features
- Better server component support
- Some breaking changes from React 18

## Performance Tips

1. **Turbopack**: Development uses `--turbopack` flag for faster builds
2. **Prisma**: Use connection pooling for production
3. **Images**: Use Next.js Image component for optimization
4. **Code Splitting**: Leverage dynamic imports for large components

## Testing Checklist

After setup, test these routes:
- [ ] `/` - Landing page loads
- [ ] `/sign-in` - Sign in page works
- [ ] `/dashboard` - Dashboard loads (after auth)
- [ ] `/dashboard/admin` - Admin panel accessible
- [ ] `/dashboard/super-admin` - Super admin panel accessible

## Getting Help

If you encounter issues:
1. Check this file for solutions
2. Review `MIGRATION_NOTES.md` for setup details
3. Check Next.js docs: https://nextjs.org/docs
4. Check Tailwind v4 docs: https://tailwindcss.com/docs/v4-beta
5. Check Prisma docs: https://www.prisma.io/docs

