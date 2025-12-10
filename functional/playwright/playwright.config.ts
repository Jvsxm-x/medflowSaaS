import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour MedflowSaaS
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Reduced parallelism for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Always retry once
  workers: process.env.CI ? 1 : 2, // Limit workers to prevent resource contention
  reporter: [
    ['html', { outputFolder: '../../reports/functional/playwright', open: 'never' }],
    ['json', { outputFile: '../../reports/functional/playwright/results.json' }],
    ['junit', { outputFile: '../../reports/functional/playwright/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // Increased to 30s for stability
    navigationTimeout: 90000, // Increased to 90s
    // Tolérance aux erreurs augmentée
    ignoreHTTPSErrors: true,
    // Accepter les downloads automatiquement
    acceptDownloads: true,
    // Additional stability settings
    bypassCSP: true,
    // Slow down operations for more reliable tests
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    },
  },
  
  // Configuration globale des timeouts
  timeout: 120000, // 120 secondes par test pour plus de marge
  expect: {
    // Timeout pour les assertions
    timeout: 20000, // 20s pour les assertions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Désactiver webServer - l'utilisateur doit démarrer le serveur manuellement
  // webServer: {
  //   command: 'echo "Start your frontend server manually"',
  //   port: 5173,
  //   reuseExistingServer: !process.env.CI,
  // },
});

