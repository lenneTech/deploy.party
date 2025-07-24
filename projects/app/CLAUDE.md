# CLAUDE.md - App Project

This file provides specific guidance for working with the deploy.party frontend application.

## Project Overview
Nuxt 3 frontend application providing a user-friendly interface for container deployment and management with real-time terminal access and PWA capabilities.

## Key Technologies
- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Tailwind CSS with custom component library
- **State Management**: Pinia stores for global state
- **GraphQL Client**: Auto-generated types from API schema
- **PWA**: Progressive Web App with service worker
- **Terminal**: XTerm.js for real-time container terminal access
- **Build System**: Vite with TypeScript support

## Development Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests with Vitest
npm run test

# Generate GraphQL types from API schema
npm run generate-types

# Preview production build
npm run preview
```

## Project Structure
- **pages/**: File-based routing with Nuxt 3 conventions
- **components/**: Reusable Vue components with TypeScript
- **stores/**: Pinia stores for state management
- **composables/**: Vue 3 composables for shared logic
- **plugins/**: Nuxt plugins for third-party integrations
- **middleware/**: Route middleware for authentication/authorization
- **assets/**: Static assets and Tailwind CSS styles
- **types/**: TypeScript type definitions and GraphQL generated types

## Key Components and Features
- **CustomForm**: Main deployment form with type selection and validation
- **Terminal**: Real-time container terminal using XTerm.js and WebSockets
- **ContainerStats**: Real-time container monitoring and statistics
- **ProjectManagement**: Project organization and deployment history
- **Authentication**: JWT-based auth with route protection
- **PWA**: Offline support and app-like experience

## State Management (Pinia)
- **auth.ts**: User authentication and session management
- **container.ts**: Container state and operations
- **project.ts**: Project data and deployment configurations
- **ui.ts**: UI state, modals, and user preferences

## GraphQL Integration
- Auto-generated types from API schema in `types/graphql.ts`
- Apollo Client integration with Nuxt
- Real-time subscriptions for container updates
- Optimistic updates for better UX

## Styling and UI
- Tailwind CSS for utility-first styling
- Custom component library with consistent design system
- Responsive design for mobile and desktop
- Dark/light mode support (if implemented)

## Real-time Features
- WebSocket connections for terminal access
- Live container statistics and logs
- Real-time deployment status updates
- Push notifications for deployment events

## PWA Configuration
- Service worker for offline functionality
- App manifest for installation
- Background sync for deployment operations
- Push notifications for deployment status

## Environment Configuration
- Runtime config in `nuxt.config.ts`
- Public/private environment variables
- API endpoint configuration
- Feature flags and environment-specific settings

## Testing
- Vitest for unit testing Vue components
- Vue Test Utils for component testing
- E2E testing setup (if configured)
- GraphQL query mocking for tests

## Important Notes
- Generate GraphQL types after API schema changes with `npm run generate-types`
- Terminal component requires WebSocket connection to API
- PWA features require HTTPS in production
- Responsive design should be tested on multiple screen sizes