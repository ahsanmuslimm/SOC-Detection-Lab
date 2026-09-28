# SOC Detection Lab - Frontend

Professional React-based frontend for the SOC Detection Lab platform. Built with TypeScript, Vite, TailwindCSS, and modern state management.

## Architecture

### Directory Structure

```
src/
├── components/          # React components
│   └── layouts/        # Layout components (MainLayout, AuthLayout)
├── pages/              # Page components (Dashboard, Alerts, Cases, etc.)
├── services/           # API services and business logic
│   ├── apiClient.ts    # HTTP client with interceptors
│   └── alertService.ts # Alert management API
├── stores/             # Zustand stores for state management
│   └── authStore.ts    # Authentication state
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── App.tsx             # Root component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env.local` and update:

```bash
cp .env.example .env.local
```

Configure API endpoint and other settings:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000
```

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

Server runs on http://localhost:5173 with API proxy to backend.

## Features

### Authentication

- JWT-based authentication
- Automatic token refresh
- Session persistence
- Role-based access control
- Protected routes

### State Management

- Zustand for global state (auth)
- React Query for server state
- Local component state
- Automatic hydration from storage

### API Integration

- Centralized HTTP client with axios
- Request/response interceptors
- Automatic error handling
- Request deduplication
- Token refresh on 401

### Pages

- **Dashboard**: Overview with stats, recent alerts, quick actions
- **Alerts**: Alert management with filtering and actions
- **Cases**: Case tracking and investigation
- **Investigations**: Investigation timeline and findings
- **Reports**: Report generation and view
- **Users**: User management (admin only)
- **Settings**: System configuration (admin only)
- **Profile**: User profile and preferences

### Components

- Main layout with sidebar navigation
- Auth layout for login
- Reusable UI components (buttons, inputs, cards)
- Toast notifications
- Loading states
- Error handling

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Testing

```bash
npm run test
npm run test:ui
npm run test:coverage
```

## Building

### Production Build

```bash
npm run build
```

Generates optimized bundle in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Code Style

### TypeScript

- Strict mode enabled
- Full type safety
- No `any` types
- Path aliases (@components, @pages, @services, etc.)

### CSS

- Tailwind CSS for styling
- No inline styles
- Responsive design
- Custom component classes

### Naming Conventions

- Components: PascalCase (ButtonComponent)
- Files: Same as export (ButtonComponent.tsx)
- Interfaces: IComponentName (IUser, IAlert)
- Stores: camelCaseStore (authStore, alertStore)
- Services: camelCaseService (apiClient, alertService)

## API Integration

### Alert Service Example

```typescript
// Get alerts with pagination
const data = await alertService.listAlerts(1, 25, {
  status: 'open',
  severity: 'critical',
  search: 'ssh'
});

// Create alert
const result = await alertService.createAlert({
  title: 'SSH Brute Force',
  description: 'Multiple failed login attempts',
  severity: 'high',
  sourceSystem: 'ssh_monitor'
});

// Update alert
await alertService.updateAlert(alertId, {
  status: 'acknowledged'
});
```

### Authentication Flow

```typescript
// Login
const { login } = useAuthStore();
await login(email, password);

// Auto refresh on 401
// API client handles automatic refresh

// Logout
const { logout } = useAuthStore();
logout();
```

## Performance Optimization

- Code splitting with Vite
- Lazy route loading with React Router
- React Query for smart caching
- Automatic tree-shaking
- Minification for production

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires ES2020 support

## Contributing

### Code Quality Standards

1. **TypeScript**: Full strict mode, no `any` types
2. **Testing**: Unit tests for services and utils
3. **Linting**: Must pass ESLint without warnings
4. **Formatting**: Prettier formatted code
5. **Comments**: JSDoc for public APIs

### Commit Guidelines

- Use conventional commits (feat, fix, refactor, etc.)
- Include issue reference when applicable
- Write descriptive commit messages

## Troubleshooting

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist .vite`
- Check Node.js version: Requires 18+

### CORS Issues

- Ensure API server is running on correct port
- Check `VITE_API_URL` in .env.local
- Verify API CORS configuration

### Hot Module Replacement Not Working

- Check Vite HMR configuration in vite.config.ts
- Restart dev server
- Hard refresh browser (Ctrl+Shift+R)

## Production Deployment

### Environment Variables

Set production environment variables:

```env
VITE_API_URL=https://api.example.com/api/v1
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=true
```

### Docker Build

```bash
# Build frontend
npm run build

# Serve with production server
npm run preview
```

### Performance Monitoring

- Enable Sentry for error tracking
- Set up analytics dashboard
- Monitor Core Web Vitals
- Track user behavior

## Tech Stack

- **React 18**: UI framework
- **TypeScript 5**: Type safety
- **Vite 5**: Build tool
- **React Router 6**: Routing
- **Zustand 4**: State management
- **Axios**: HTTP client
- **React Query 5**: Server state
- **TailwindCSS 3**: Styling
- **Lucide React**: Icons
- **React Hot Toast**: Notifications

## License

MIT - See LICENSE file for details
