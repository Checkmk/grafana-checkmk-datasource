export {};

Cypress.Commands.add('loginGrafana', () => {
  cy.visit('/login');
  cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
  cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
  cy.get('[aria-label="Login button"]').click();
});

Cypress.Commands.add('addNewPanel', () => {
  // add a new panel in a new dashboard
  cy.visit('/dashboard/new');
  cy.get('button[aria-label="Add new panel"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginGrafana(): Chainable<void>;
      addNewPanel(): Chainable<void>;
    }
  }
}
