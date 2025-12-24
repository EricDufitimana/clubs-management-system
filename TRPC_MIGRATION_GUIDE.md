# tRPC Migration Guide - Clubs Management System

## ✅ Completed Migrations

### 1. Core tRPC Infrastructure
- ✅ `src/trpc/routers/users.ts` - User management
- ✅ `src/trpc/routers/clubs.ts` - Club CRUD operations
- ✅ `src/trpc/routers/students.ts` - Student management
- ✅ `src/trpc/routers/attendance.ts` - Attendance tracking
- ✅ `src/trpc/routers/sessions.ts` - Session management
- ✅ `src/trpc/routers/dashboard.ts` - Dashboard stats
- ✅ `src/trpc/routers/auth.ts` - Authentication

### 2. Migrated Views
- ✅ `src/sections/user/view/user-view.tsx` - Full tRPC migration with prefetching
- ✅ `src/app/dashboard/user/page.tsx` - Server-side prefetching enabled
- ⚠️ `src/sections/attendance/view/attendance-view.tsx` - Partial migration (needs completion)

### 3. Deleted Obsolete Files
- ✅ `src/actions/removeStudent.ts`
- ✅ `src/app/api/user/club-by-user/route.ts`
- ✅ `src/app/api/clubs/fetch/route.ts`
- ✅ `src/app/api/students/fetch/route.ts`

## 🔄 Pending Migrations

### High Priority Files

#### 1. Clubs Management (`src/sections/clubs/view/clubs-view.tsx`)
**Current API calls:**
- `GET /api/clubs/fetch` → Use `trpc.clubs.getAllClubs.query()`
- `activateClub()` action → Use `trpc.clubs.reactivateClub.mutate()`
- `deactivateClub()` action → Use `trpc.clubs.deactivateClub.mutate()`

**Migration Steps:**
```typescript
// Replace fetch with tRPC
const { data: clubsData, isLoading } = useQuery({
  ...trpc.clubs.getAllClubs.queryOptions(),
  enabled: !!userId,
});

// Replace actions with mutations
const deactivateMutation = useMutation({
  ...trpc.clubs.deactivateClub.mutationOptions(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
  },
});
```

#### 2. Super Admin Clubs (`src/sections/super-admin/view/super-admin-clubs-view.tsx`)
**Current API calls:**
- `GET /api/clubs/fetch` → Use `trpc.clubs.getAllClubs.query()`
- Same mutations as clubs-view.tsx

#### 3. Sessions View (`src/sections/sessions/view/sessions-view.tsx`)
**Current API calls:**
- `GET /api/sessions` → Use `trpc.sessions.getSessions.query()`
- `POST /api/sessions` → Use `trpc.sessions.createSession.mutate()`

#### 4. Left Members View (`src/sections/user/view/left-members-view.tsx`)
**Current API calls:**
- Likely uses `/api/students/left` or similar
- Create `trpc.users.getLeftMembers.query()`

### API Routes to Delete (After Migration)
```
src/app/api/attendance/route.ts
src/app/api/sessions/route.ts
src/app/api/sessions/without-attendance/route.ts
src/app/api/club/members/add/route.ts
src/app/api/club/members/check/route.ts
src/app/api/students/left/route.ts
src/app/api/dashboard/stats/route.ts (if not used elsewhere)
```

### Server Actions to Delete
```
src/actions/activateClub.ts
src/actions/deactivateClub.ts
```

## 📋 Migration Checklist for Each View

For each view component, follow these steps:

### 1. Add Imports
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
```

### 2. Replace fetch() calls with useQuery
```typescript
// Before
const fetchData = async () => {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
  setState(data);
};

// After
const { data, isLoading } = useQuery({
  ...trpc.router.procedure.queryOptions(),
  enabled: !!userId,
});

useEffect(() => {
  if (data) {
    setState(data);
  }
}, [data]);
```

### 3. Replace server actions with useMutation
```typescript
// Before
const handleAction = async () => {
  const result = await serverAction(params);
  if ('error' in result) {
    // handle error
  }
};

// After
const mutation = useMutation({
  ...trpc.router.procedure.mutationOptions(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: trpc.router.query.queryKey() });
  },
  onError: (error) => {
    // handle error
  },
});

const handleAction = () => {
  mutation.mutate(params);
};
```

### 4. Add Prefetching to page.tsx
```typescript
// In src/app/[route]/page.tsx
export default async function Page() {
  const queryClient = getQueryClient();
  
  // Prefetch all queries used by the view
  await queryClient.prefetchQuery(trpc.router.procedure.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ViewComponent />
    </HydrationBoundary>
  );
}
```

### 5. Remove old imports
- Remove `fetch` calls
- Remove server action imports
- Remove manual error handling boilerplate

## 🎯 tRPC Router API Reference

### Users Router (`trpc.users`)
- `getUsersByClub()` - Get users in admin's clubs
- `getAllUsers()` - Get all users (super admin)

### Clubs Router (`trpc.clubs`)
- `getClubs()` - Get user's clubs
- `getAllClubs()` - Get all clubs (super admin)
- `getCurrentUserClub()` - Get admin's club
- `createClub(input)` - Create new club
- `updateClub(input)` - Update club
- `deactivateClub(input)` - Deactivate club
- `reactivateClub(input)` - Reactivate club
- `checkClubMembers(input)` - Check existing members
- `addMembers(input)` - Add members to club

### Students Router (`trpc.students`)
- `getAllStudents()` - Get all students
- `removeStudent(input)` - Remove student from club

### Attendance Router (`trpc.attendance`)
- `getAttendanceRecords()` - Get attendance records
- `recordAttendance(input)` - Record attendance for session

### Sessions Router (`trpc.sessions`)
- `getSessions()` - Get all sessions
- `getSessionsWithoutAttendance()` - Get sessions needing attendance
- `createSession(input)` - Create new session
- `deleteSession(input)` - Delete session

### Dashboard Router (`trpc.dashboard`)
- `getStats()` - Get dashboard statistics

### Auth Router (`trpc.auth`)
- `login(input)` - User login

## 🚀 Benefits of tRPC Migration

1. **Type Safety** - End-to-end TypeScript inference
2. **Performance** - Server-side prefetching eliminates loading states
3. **Developer Experience** - No manual fetch/error handling
4. **Caching** - Automatic query caching and invalidation
5. **Code Reduction** - ~50% less boilerplate code
6. **Maintainability** - Centralized API logic
7. **Error Handling** - Consistent error handling across app
8. **Real-time Updates** - Easy query invalidation and refetching

## 📊 Progress Tracker

- Core Infrastructure: 100% ✅
- User Management: 100% ✅
- Dashboard: 100% ✅
- Attendance: 50% ⚠️
- Clubs Management: 0% ❌
- Sessions: 0% ❌
- Left Members: 0% ❌

**Overall Progress: ~40%**

## 🎓 Best Practices

1. **Always prefetch on server** - Use `queryClient.prefetchQuery()` in page.tsx
2. **Use enabled flags** - Prevent queries from running before data is ready
3. **Invalidate on mutations** - Always invalidate related queries after mutations
4. **Handle loading states** - Use `isLoading` from useQuery
5. **Type your data** - Define proper TypeScript types for all data
6. **Error boundaries** - Wrap views in error boundaries for better UX
7. **Optimistic updates** - Use for better perceived performance
8. **Query keys** - Use `trpc.router.procedure.queryKey()` for invalidation

## 📝 Notes

- All tRPC procedures use middleware for authentication (`adminProcedure`, `superAdminProcedure`)
- Context provides `user`, `role`, `clubs`, and `clubIds` automatically
- All BigInt values are converted to strings for JSON serialization
- Prisma queries are type-safe and use proper relations instead of raw SQL where possible

## 🔗 Related Files

- `src/trpc/init.ts` - tRPC context and middleware
- `src/trpc/client.tsx` - Client-side tRPC setup
- `src/trpc/server.tsx` - Server-side tRPC helpers
- `src/trpc/routers/_app.ts` - Main router configuration

