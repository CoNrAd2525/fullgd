const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_URL = 'http://localhost:3000/api/v1';
const API_TOKEN = 'YOUR_API_TOKEN'; // Replace with your actual API token

// Test webhook data
const webhookData = {
  name: 'Test Webhook',
  description: 'A webhook for testing purposes',
  targetUrl: 'https://webhook.site/YOUR_WEBHOOK_ID', // Replace with your webhook.site URL or any test endpoint
  events: ['workflow.completed', 'agent.completed'],
  isActive: true,
  headers: {
    'X-Custom-Header': 'test-value'
  }
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data
    });
    return response.data;
  } catch (error) {
    console.error('API Request Error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
};

// Test functions
const testCreateWebhook = async () => {
  console.log('\n=== Testing Webhook Creation ===');
  try {
    const result = await apiRequest('post', '/webhooks', webhookData);
    console.log('Webhook created successfully:', result.data.id);
    return result.data;
  } catch (error) {
    console.error('Failed to create webhook');
    return null;
  }
};

const testGetWebhooks = async () => {
  console.log('\n=== Testing Get All Webhooks ===');
  try {
    const result = await apiRequest('get', '/webhooks');
    console.log(`Retrieved ${result.data.length} webhooks`);
    return result.data;
  } catch (error) {
    console.error('Failed to get webhooks');
    return [];
  }
};

const testGetWebhook = async (webhookId) => {
  console.log(`\n=== Testing Get Webhook ${webhookId} ===`);
  try {
    const result = await apiRequest('get', `/webhooks/${webhookId}`);
    console.log('Webhook details retrieved successfully');
    return result.data;
  } catch (error) {
    console.error('Failed to get webhook details');
    return null;
  }
};

const testUpdateWebhook = async (webhookId) => {
  console.log(`\n=== Testing Update Webhook ${webhookId} ===`);
  try {
    const updateData = {
      name: 'Updated Test Webhook',
      description: 'This webhook has been updated',
      events: ['workflow.completed', 'workflow.failed', 'agent.completed']
    };
    const result = await apiRequest('put', `/webhooks/${webhookId}`, updateData);
    console.log('Webhook updated successfully');
    return result.data;
  } catch (error) {
    console.error('Failed to update webhook');
    return null;
  }
};

const testWebhook = async (webhookId) => {
  console.log(`\n=== Testing Webhook ${webhookId} ===`);
  try {
    const result = await apiRequest('post', `/webhooks/${webhookId}/test`);
    console.log('Webhook test result:', result);
    return result;
  } catch (error) {
    console.error('Failed to test webhook');
    return null;
  }
};

const testDeleteWebhook = async (webhookId) => {
  console.log(`\n=== Testing Delete Webhook ${webhookId} ===`);
  try {
    const result = await apiRequest('delete', `/webhooks/${webhookId}`);
    console.log('Webhook deleted successfully');
    return result;
  } catch (error) {
    console.error('Failed to delete webhook');
    return null;
  }
};

// Run all tests
const runTests = async () => {
  try {
    // Create a webhook
    const webhook = await testCreateWebhook();
    if (!webhook) return;

    // Get all webhooks
    await testGetWebhooks();

    // Get webhook details
    await testGetWebhook(webhook.id);

    // Update webhook
    await testUpdateWebhook(webhook.id);

    // Test webhook
    await testWebhook(webhook.id);

    // Delete webhook
    await testDeleteWebhook(webhook.id);

    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
};

// Run the tests
runTests();