const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const watchedResourceTypes = new Set([
  'document',
  'stylesheet',
  'script',
  'image',
  'font',
  'xhr',
  'fetch',
]);

test('page loads, creates a todo and toggles its state without runtime errors', async ({ page }, testInfo) => {
  const diagnostics = {
    javascriptErrors: [],
    consoleErrors: [],
    failedRequests: [],
    badResponses: [],
  };

  page.on('pageerror', (error) => diagnostics.javascriptErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      error: request.failure()?.errorText || 'unknown request failure',
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && watchedResourceTypes.has(response.request().resourceType())) {
      diagnostics.badResponses.push({
        url: response.url(),
        status: response.status(),
        resourceType: response.request().resourceType(),
      });
    }
  });

  await page.goto('/todomvc/', { waitUntil: 'networkidle' });

  await expect(page).toHaveTitle(/TodoMVC/);
  await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();

  const todoText = `Playwright check ${testInfo.project.name}`;
  const newTodo = page.getByPlaceholder('What needs to be done?');
  await newTodo.fill(todoText);
  await newTodo.press('Enter');

  const todoItem = page.locator('.todo-list li').filter({ hasText: todoText });
  const checkbox = todoItem.getByRole('checkbox');

  await expect(todoItem).toBeVisible();
  await expect(todoItem).not.toHaveClass(/completed/);
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(todoItem).toHaveClass(/completed/);

  const screenshotPath = testInfo.outputPath('screenshots', 'todo-completed.png');
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await testInfo.attach('runtime-and-resource-diagnostics', {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
    contentType: 'application/json',
  });

  expect(diagnostics.javascriptErrors, 'uncaught JavaScript errors').toEqual([]);
  expect(diagnostics.consoleErrors, 'browser console errors').toEqual([]);
  expect(diagnostics.failedRequests, 'failed resource requests').toEqual([]);
  expect(diagnostics.badResponses, 'resource responses with HTTP status 400+').toEqual([]);
});

