/**
 * Utilitaires robustes pour les tests Playwright
 * Basés sur la structure réelle du frontend MedflowSaaS
 */

import { Page } from '@playwright/test';

/**
 * Vérifie si un élément existe et est visible
 */
export async function elementExists(page: Page, selector: string, timeout = 3000): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Essaie plusieurs sélecteurs et retourne le premier qui fonctionne
 */
export async function trySelectors<T>(
  page: Page,
  selectors: string[],
  action: (page: Page, selector: string) => Promise<T>,
  timeout = 3000
): Promise<T | null> {
  for (const selector of selectors) {
    try {
      if (await elementExists(page, selector, timeout)) {
        return await action(page, selector);
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Remplit un champ avec plusieurs sélecteurs possibles
 */
export async function fillFieldSafe(
  page: Page,
  selectors: string[],
  value: string,
  timeout = 3000
): Promise<boolean> {
  const result = await trySelectors(
    page,
    selectors,
    async (p, sel) => {
      await p.fill(sel, value, { timeout });
      return true;
    },
    timeout
  );
  return result === true;
}

/**
 * Clique sur un élément avec plusieurs sélecteurs possibles
 */
export async function clickSafe(
  page: Page,
  selectors: string[],
  timeout = 3000
): Promise<boolean> {
  const result = await trySelectors(
    page,
    selectors,
    async (p, sel) => {
      await p.click(sel, { timeout });
      return true;
    },
    timeout
  );
  return result === true;
}

/**
 * Attend qu'un élément soit visible avec plusieurs sélecteurs possibles
 */
export async function waitForAnyElement(
  page: Page,
  selectors: string[],
  timeout = 5000
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Navigue vers une page avec retry
 */
export async function navigateSafe(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    return true;
  } catch {
    return false;
  }
}

/**
 * Attend que le formulaire soit chargé (détecte n'importe quel input)
 */
export async function waitForForm(page: Page, timeout = 10000): Promise<boolean> {
  const formSelectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[type="password"]',
    'form input',
    'input'
  ];
  
  return await waitForAnyElement(page, formSelectors, timeout);
}

/**
 * Remplit un champ de formulaire standard
 */
export async function fillFormField(
  page: Page,
  fieldName: string,
  value: string
): Promise<boolean> {
  const selectors = [
    `input[name="${fieldName}"]`,
    `input[placeholder*="${fieldName}" i]`,
    `input#${fieldName}`,
    `input.${fieldName}`,
    `input[type="${fieldName === 'email' ? 'email' : 'text'}"]`
  ];
  
  return await fillFieldSafe(page, selectors, value);
}

/**
 * Clique sur un bouton de soumission
 */
export async function submitForm(page: Page): Promise<boolean> {
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Connexion")',
    'button:has-text("Login")',
    'button:has-text("S\'inscrire")',
    'button:has-text("Register")',
    'button:has-text("Enregistrer")',
    'button:has-text("Save")',
    'form button[type="submit"]'
  ];
  
  return await clickSafe(page, submitSelectors);
}

/**
 * Vérifie si l'utilisateur est connecté (présence de token)
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const token = await page.evaluate(() => {
      try {
        return localStorage.getItem('token') || 
               localStorage.getItem('authToken') || 
               sessionStorage.getItem('token');
      } catch {
        return null;
      }
    });
    return token !== null && token.length > 0;
  } catch {
    return false;
  }
}

/**
 * Configure le token d'authentification via addInitScript
 */
export async function setAuthToken(context: any, token: string): Promise<void> {
  await context.addInitScript((t: string) => {
    try {
      window.localStorage.setItem('token', t);
      window.sessionStorage.setItem('token', t);
    } catch (e) {
      // Ignore si localStorage n'est pas accessible
    }
  }, token);
}

/**
 * Attend que la navigation soit terminée
 */
export async function waitForNavigationComplete(page: Page): Promise<void> {
  try {
    // Check if page is still valid before waiting
    if (page.isClosed()) return;
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    try {
      if (page.isClosed()) return;
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    } catch {
      // Only wait if page is still open
      if (!page.isClosed()) {
        await page.waitForTimeout(2000);
      }
    }
  }
}

/**
 * Sélecteurs communs basés sur la structure réelle du frontend
 */
export const SELECTORS = {
  // Navigation
  loginLink: ['text=Se connecter', 'text=Login', 'a[href*="login"]'],
  registerLink: ['text=S\'inscrire', 'text=Register', 'a[href*="register"]'],
  
  // Champs de formulaire
  username: ['input[name="username"]'],
  password: ['input[name="password"]', 'input[type="password"]'],
  email: ['input[name="email"]', 'input[type="email"]'],
  firstName: ['input[name="first_name"]', 'input[name="firstName"]'],
  lastName: ['input[name="last_name"]', 'input[name="lastName"]'],
  
  // Boutons
  submit: ['button[type="submit"]'],
  logout: ['text=Déconnexion', 'text=Logout', '[aria-label*="logout" i]'],
  
  // Messages
  success: ['.success-message', '.alert-success', '[data-testid="success"]'],
  error: ['.error-message', '.alert-danger', '[data-testid="error"]'],
};
