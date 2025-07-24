# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
deploy.party is a simple and user-friendly deployment tool that allows users to deploy applications with a simple UI. It supports deployment from GitLab/GitHub, Docker registries, and includes features like automatic SSL, backups, container management, and integrated terminals.

## Architecture
This is a monorepo managed with **Lerna** containing two main applications:
- **API** (`projects/api/`): NestJS-based GraphQL API server with TypeScript, MongoDB, and Docker integration
- **App** (`projects/app/`): Nuxt 3 frontend application with Vue 3, Tailwind CSS, and PWA support

## Development Commands

### Root Level (Lerna orchestrated)
```bash
# Install dependencies for all projects
npm run init

# Start development servers for both API and App
npm run dev

# Build all projects
npm run build

# Run tests across all projects
npm run test

# Lint all projects
npm run lint

# Format code across all projects
npm run format

# Clean reinstall
npm run reinit
```

### API Commands (`projects/api/`)
```bash
# Development with hot reload
npm run start:dev

# Start with database migrations
npm run start

# Run E2E tests
npm run test:e2e

# Database migrations
npm run migrate:up
npm run migrate:create

# Build API documentation
npm run docs

# Production build
npm run build
```

### App Commands (`projects/app/`)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests with Vitest
npm run test

# Generate GraphQL types
npm run generate-types
```

## Key Architecture Components

### API Structure
- **GraphQL API**: Primary interface using Apollo Server with NestJS
- **Modules**: 
  - `container/`: Docker container management and orchestration
  - `project/`: Project organization and management
  - `auth/`: JWT-based authentication with user management
  - `backup/`: S3-compatible backup system
  - `source/`: Git source integration (GitLab/GitHub)
  - `registry/`: Docker registry management
  - `build/`: Container build processing
- **Docker Integration**: Core service using dockerode for container lifecycle management
- **Database**: MongoDB with Mongoose ODM
- **Background Jobs**: Bull queue system with Redis
- **Real-time**: WebSocket gateway for terminal access

### Frontend Structure
- **Nuxt 3 Framework**: Vue 3 with server-side rendering
- **State Management**: Pinia stores for global state
- **UI Components**: Custom component library with Tailwind CSS
- **GraphQL Client**: Auto-generated types from API schema
- **PWA**: Progressive Web App with service worker
- **Real-time Terminal**: XTerm.js integration for container access

## Environment Configuration
Both applications use environment-based configuration:
- API: `src/config.env.ts` for centralized environment handling
- App: Runtime config in `nuxt.config.ts` with public/private variables

## Docker Integration
The system heavily integrates with Docker for:
- Container lifecycle management (create, start, stop, remove)
- Image building and registry operations
- Docker Compose generation for various container types
- Statistics and logging collection
- Volume and network management

## Database Migrations
API uses a custom migration system with TypeScript templates in the `migrations/` directory. Always run migrations before starting the API in new environments.

## Testing
- API: Jest-based E2E testing in `tests/` directory
- App: Vitest for unit testing with Vue Test Utils
- Both projects include linting with ESLint and formatting with Prettier