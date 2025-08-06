# API Documentation

## Overview

This directory contains the API documentation for the Unified AI Agent Platform. The documentation is generated using Swagger/OpenAPI and can be accessed through the `/api/docs` endpoint when the server is running.

## Files

- `swagger.yaml`: The OpenAPI specification file that defines the API endpoints, request/response schemas, and other API details.
- `swagger.ts`: The TypeScript file that sets up the Swagger UI in the Express application.

## Webhook API

The webhook API allows you to create, manage, and test webhooks for the platform. Webhooks enable you to receive notifications when specific events occur in the system, such as workflow completion, agent execution, and more.

For detailed information about the webhook API, please refer to:

1. The Swagger documentation at `/api/docs` when the server is running
2. The `webhook-integration.md` file in this directory for a comprehensive guide on using webhooks

## Setting Up

To set up the API documentation:

1. Make sure the required dependencies are installed:
   ```bash
   npm install js-yaml swagger-ui-express
   npm install --save-dev @types/js-yaml @types/swagger-ui-express
   ```
   
   Or run the provided batch file:
   ```bash
   ./install-swagger-deps.bat
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Access the documentation at:
   ```
   http://localhost:3000/api/docs
   ```

## Extending the Documentation

To add new endpoints or update existing ones:

1. Edit the `swagger.yaml` file to include the new endpoints, schemas, or parameters
2. Restart the server to see the changes

## Pipedream Integration

The webhook system integrates seamlessly with Pipedream for no-code automation. For detailed instructions on setting up Pipedream integration, please refer to the `webhook-integration.md` file in this directory.