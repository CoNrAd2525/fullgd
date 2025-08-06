# Webhook Integration Guide

## Overview

The Unified AI Agent Platform provides a robust webhook system that allows you to receive notifications when specific events occur in the platform. This enables you to build event-driven architectures and integrate with external systems like Pipedream, Zapier, or custom applications.

## Webhook Concepts

### What is a Webhook?

A webhook is a way for an application to provide other applications with real-time information. It delivers data to other applications as it happens, meaning you get data immediately. Unlike typical APIs where you would need to poll for data frequently to get it real-time.

### How Webhooks Work in the Platform

1. **Registration**: You register a webhook URL in the platform and specify which events you want to subscribe to.
2. **Event Occurs**: When a specified event occurs in the platform (e.g., a workflow completes).
3. **Notification**: The platform sends an HTTP POST request to your webhook URL with a JSON payload containing information about the event.
4. **Processing**: Your application receives and processes the webhook payload.

## Setting Up Webhooks

### Creating a Webhook

1. Navigate to the Webhooks section in the dashboard
2. Click "Create Webhook"
3. Fill in the following details:
   - **Name**: A descriptive name for your webhook
   - **Description** (optional): Additional information about the webhook's purpose
   - **Target URL**: The URL that will receive the webhook notifications
   - **Events**: Select the events you want to subscribe to
   - **Headers** (optional): Custom HTTP headers to include in webhook requests
   - **Active**: Toggle to enable/disable the webhook
4. Click "Save" to create the webhook

### Webhook Security

Webhooks include a signature header (`X-Webhook-Signature`) that allows you to verify that the request came from our platform. The signature is an HMAC-SHA256 hash of the request body, using your webhook's secret as the key.

To verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(requestBody, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(requestBody));
  const calculatedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}
```

## Webhook Events

The platform supports the following webhook events:

### Workflow Events

- `workflow.completed`: Triggered when a workflow execution completes successfully
- `workflow.failed`: Triggered when a workflow execution fails
- `workflow.stopped`: Triggered when a workflow execution is stopped manually

### Agent Events

- `agent.completed`: Triggered when an agent execution completes successfully
- `agent.failed`: Triggered when an agent execution fails
- `agent.stopped`: Triggered when an agent execution is stopped manually

## Webhook Payload Structure

All webhook payloads follow this general structure:

```json
{
  "id": "webhook-event-id",
  "event": "event.name",
  "timestamp": "2023-06-15T12:30:45Z",
  "data": {
    // Event-specific data
  }
}
```

### Workflow Event Payload Examples

#### workflow.completed

```json
{
  "id": "webhook-event-id",
  "event": "workflow.completed",
  "timestamp": "2023-06-15T12:30:45Z",
  "data": {
    "workflowId": "workflow-id",
    "executionId": "execution-id",
    "status": "completed",
    "result": {
      // Workflow result data
    }
  }
}
```

#### workflow.failed

```json
{
  "id": "webhook-event-id",
  "event": "workflow.failed",
  "timestamp": "2023-06-15T12:30:45Z",
  "data": {
    "workflowId": "workflow-id",
    "executionId": "execution-id",
    "status": "failed",
    "error": "Error message"
  }
}
```

### Agent Event Payload Examples

#### agent.completed

```json
{
  "id": "webhook-event-id",
  "event": "agent.completed",
  "timestamp": "2023-06-15T12:30:45Z",
  "data": {
    "agentId": "agent-id",
    "executionId": "execution-id",
    "status": "completed",
    "result": {
      // Agent result data
    }
  }
}
```

## Testing Webhooks

You can test your webhooks directly from the platform:

1. Navigate to the Webhooks section in the dashboard
2. Find the webhook you want to test
3. Click the "Test" button
4. The platform will send a test event to your webhook URL
5. You can view the response status and details in the webhook test results

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Verify that the webhook is active
   - Check that the URL is correct and accessible from the internet
   - Ensure your server is properly handling POST requests

2. **Signature verification failing**
   - Make sure you're using the correct webhook secret
   - Verify that you're calculating the signature correctly
   - Check for any JSON stringification differences

3. **Webhook timeouts**
   - Webhook requests have a 10-second timeout
   - Ensure your endpoint responds quickly
   - Consider implementing an acknowledgement pattern for long-running processes

## Best Practices

1. **Respond quickly**: Your webhook endpoint should acknowledge receipt of the webhook as quickly as possible, ideally within a few seconds.

2. **Implement retries**: Design your webhook consumer to handle retries in case of temporary failures.

3. **Verify signatures**: Always verify the webhook signature to ensure the request is legitimate.

4. **Use idempotency keys**: The webhook ID can be used as an idempotency key to prevent duplicate processing.

5. **Monitor webhook health**: Regularly check your webhook logs to ensure they're functioning correctly.

## Pipedream Integration

[Pipedream](https://pipedream.com/) is a powerful integration platform that allows you to connect apps and build workflows with no code. The Unified AI Agent Platform's webhook system integrates seamlessly with Pipedream.

### Setting Up Pipedream Integration

1. **Create a Pipedream account**: Sign up at [pipedream.com](https://pipedream.com/)

2. **Create a new workflow in Pipedream**:
   - Click "New Workflow"
   - Select "HTTP / Webhook" as the trigger
   - Copy the generated webhook URL

3. **Create a webhook in the Unified AI Agent Platform**:
   - Navigate to the Webhooks section
   - Create a new webhook using the Pipedream URL
   - Select the events you want to trigger the workflow

4. **Configure actions in Pipedream**:
   - Add steps to your Pipedream workflow to process the webhook data
   - Connect to other apps and services as needed

### Example Pipedream Workflow: Slack Notifications

1. **Trigger**: HTTP / Webhook (receives webhook from Unified AI Agent Platform)
2. **Filter**: Only process `workflow.completed` events
3. **Transform**: Format the message for Slack
4. **Action**: Send a message to a Slack channel

### Example Pipedream Workflow: Data Logging

1. **Trigger**: HTTP / Webhook (receives webhook from Unified AI Agent Platform)
2. **Transform**: Format the data for your database
3. **Action**: Insert the data into a database (e.g., Airtable, Google Sheets, PostgreSQL)

## API Reference

### Webhook Endpoints

#### GET /api/v1/webhooks

Retrieve all webhooks for the authenticated user.

#### POST /api/v1/webhooks

Create a new webhook.

Request body:
```json
{
  "name": "My Webhook",
  "description": "Webhook for workflow completions",
  "targetUrl": "https://example.com/webhook",
  "events": ["workflow.completed", "agent.completed"],
  "headers": {
    "X-Custom-Header": "custom-value"
  },
  "isActive": true
}
```

#### GET /api/v1/webhooks/:id

Retrieve a specific webhook by ID.

#### PUT /api/v1/webhooks/:id

Update a webhook.

#### DELETE /api/v1/webhooks/:id

Delete a webhook.

#### POST /api/v1/webhooks/:id/test

Test a webhook by sending a test event.

#### POST /api/v1/webhooks/receive

Endpoint for receiving webhooks from external services like Pipedream.