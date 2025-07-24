# CLAUDE.md - API Project

This file provides specific guidance for working with the deploy.party API backend.

## Project Overview
NestJS-based GraphQL API server that handles container orchestration, user management, and deployment automation for the deploy.party platform.

## Key Technologies
- **Framework**: NestJS with TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: MongoDB with Mongoose ODM
- **Queue System**: Bull queues with Redis
- **Container Management**: Docker API via dockerode
- **Authentication**: JWT with Passport
- **Real-time**: WebSocket gateway for terminal access

## Development Commands
```bash
# Development with hot reload
npm run start:dev

# Start with database migrations
npm run start

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Generate API documentation
npm run docs

# Database migrations
npm run migrate:up
npm run migrate:create
```

## Module Structure
- **auth/**: JWT authentication, user management, and authorization
- **container/**: Docker container lifecycle management and orchestration
- **project/**: Project organization, deployment configuration
- **backup/**: S3-compatible backup system for data persistence
- **source/**: Git repository integration (GitLab/GitHub)
- **registry/**: Docker registry management and image operations
- **build/**: Container build processing and optimization
- **gateway/**: WebSocket gateway for real-time terminal access

## Key Files and Patterns
- **GraphQL Resolvers**: Located in each module's resolver files (`*.resolver.ts`)
- **Services**: Business logic in service files (`*.service.ts`)
- **DTOs**: Input/output types in `dto/` directories
- **Entities**: MongoDB schemas in `entities/` directories
- **Guards**: Authentication/authorization in `guards/` directory
- **Configuration**: Environment handling in `src/config.env.ts`

## Docker Integration
The API extensively uses Docker for:
- Container lifecycle management (create, start, stop, remove)
- Image building and registry operations
- Docker Compose generation for various container types
- Real-time statistics and logging collection
- Volume and network management

## Database Migrations
- Custom migration system with TypeScript templates
- Located in `migrations/` directory
- Always run `npm run migrate:up` before starting in new environments
- Create new migrations with `npm run migrate:create <name>`

## Testing
- E2E tests using Jest in `tests/` directory
- Test database isolation and cleanup
- Container integration testing
- GraphQL query/mutation testing

## Environment Variables
Key environment variables configured in `src/config.env.ts`:
- Database connection strings
- Docker daemon configuration
- JWT secrets and authentication settings
- S3/backup storage credentials
- Redis connection for queues

## Important Notes
- Always ensure Docker daemon is running during development
- Database migrations must be run before starting the API
- Real-time features require WebSocket connection handling
- Container operations require appropriate Docker permissions