# Otrium Loyalty Program - Backend Service

This project implements the backend service for Otrium's loyalty program. 
It's built using NestJS, TypeScript, and AWS serverless technologies. 
The system is designed to be scalable, resilient, and maintainable.

More information: [Architecture](./docs/Architecture.md) | 
[Database](./docs/Database.md) | 
[Leadership](./docs/Leadership.md)


## Introduction

### Architecture overview

The system follows an event-driven architecture using:

- **AWS EventBridge:** For routing events (e.g., purchase completion events).
- **AWS SQS:** For asynchronous processing of events, ensuring reliability and decoupling.
- **AWS Lambda:** For executing the core business logic (reading user data and processing purchase events).
- **AWS DynamoDB:** For storing loyalty program data (user points, transaction history, etc.).
- **API Gateway:** For exposing the REST API.

The service is split into two Lambda functions:

- **`loyalty-api`:** Handles requests to retrieve a user's current points balance. It exposes a REST API endpoint via API Gateway.
- **`loyalty-event-processor`:** Processes purchase events (received via SQS) to update user points balances in DynamoDB.

### Project Structure

The codebase is organized as a monorepo using `nx`, with the following main packages:

- `packages/loyalty-api`: The Lambda function for reading points.
- `packages/loyalty-event-processor`: The Lambda function for processing purchase events.
- `packages/shared`: A shared library containing common code (domain models, database interactions, utility functions) used by both Lambda functions. This promotes code reuse and consistency.

### Building and Running

The following scripts are available (using `nx` for monorepo management):

- **`npm run build`:** Builds all packages (api, processor, and shared).
- **`npm run test:unit`:** Runs unit tests for all packages.
- **`npm run api`**: Runs the API locally.
- **`npm run test:e2e`:** Runs end-to-end tests. (Note: You'll need to set up appropriate infrastructure for e2e tests).
- **`npm run lint:all`**: Lints all files.

Made with <a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45" />
