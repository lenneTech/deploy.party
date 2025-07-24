# GitHub Copilot Instructions

## Project Context
deploy.party is a user-friendly deployment tool with a monorepo structure containing API (NestJS) and App (Nuxt 3) projects.

## Architecture Overview
- **Monorepo**: Managed with Lerna
- **API**: NestJS GraphQL server with MongoDB, Docker integration
- **App**: Nuxt 3 frontend with Vue 3, Tailwind CSS, PWA support

## Code Style Guidelines
- Use TypeScript for all new code
- Follow existing naming conventions and patterns
- Prefer composition over inheritance
- Use arrow functions for consistency
- Follow Vue 3 Composition API patterns in frontend
- Use NestJS decorators and dependency injection in API

## Key Patterns to Follow

### API Development
- Use GraphQL resolvers with proper DTOs
- Implement proper error handling with custom exceptions
- Use MongoDB with Mongoose schemas
- Implement background jobs with Bull queues
- Use Docker API via dockerode for container operations
- Follow module-based architecture (auth, container, project, etc.)

### Frontend Development
- Use Vue 3 Composition API with `<script setup>`
- Implement Pinia stores for state management
- Use auto-generated GraphQL types
- Follow Nuxt 3 file-based routing conventions
- Use Tailwind CSS for styling
- Implement proper TypeScript interfaces

## Docker Integration
- Use dockerode for all Docker operations
- Implement proper container lifecycle management
- Generate Docker Compose files dynamically
- Handle Docker errors gracefully
- Use proper volume and network management

## Testing Approach
- Write E2E tests for API endpoints
- Use Vitest for frontend component testing
- Mock external dependencies (Docker, MongoDB)
- Test GraphQL operations thoroughly
- Implement proper test isolation

## Environment Configuration
- Use centralized config in `src/config.env.ts` for API
- Use Nuxt runtime config for frontend
- Never hardcode environment-specific values
- Provide sensible defaults for development

## Security Considerations
- Use JWT for authentication
- Implement proper input validation
- Sanitize all user inputs
- Use proper CORS configuration
- Implement rate limiting where appropriate

## Performance Guidelines
- Use pagination for large datasets
- Implement proper caching strategies
- Optimize GraphQL queries to prevent N+1 problems
- Use lazy loading for Vue components
- Implement proper database indexing

## Deployment Considerations
- Ensure Docker containers are properly configured
- Use proper health checks
- Implement graceful shutdowns
- Use environment-specific configurations
- Follow container best practices

## Database Operations
- Always run migrations before schema changes
- Use proper MongoDB indexing
- Implement data validation at schema level
- Use transactions for complex operations
- Handle database errors gracefully

## Real-time Features
- Use WebSockets for terminal access
- Implement proper connection management
- Handle connection failures gracefully
- Use subscriptions for live updates
- Implement proper cleanup for connections

## Common Pitfalls to Avoid
- Don't bypass authentication checks
- Don't create containers without proper cleanup
- Don't ignore Docker daemon errors
- Don't skip input validation
- Don't hardcode configuration values
- Don't forget to handle WebSocket disconnections