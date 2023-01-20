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

Cypress.Commands.add('addCmkDatasource', (cmkUser: string, cmkPass: string) => {
  cy.visit('/datasources/new');
  cy.get('button[aria-label="Add data source Checkmk"]').contains('Checkmk').click();

  cy.get('[data-test-id="checkmk-url"]').type(Cypress.env('grafanaToCheckmkUrl'));
  cy.get('[data-test-id="checkmk-username"]').type(cmkUser);
  cy.get('[data-test-id="checkmk-password"]').type(cmkPass);
  cy.get('[id="checkmk-version"]').type('<{enter}');

  cy.get('[aria-label="Data source settings page Save and Test button"]').click();

  cy.get('[data-testid="data-testid Alert success"]').should('be.visible');
  cy.contains('Data source is working').should('be.visible');
});

Cypress.Commands.add('rmCmkDatasource', () => {
  // Remove the previously-created datasource as teardown process.
  // This makes sure the tests use the newly generated datasource in each execution.
  // Important especially when running the tests locally if docker images are up during multiple tests' executions.

  cy.visit('/datasources/');

  cy.get('[class="page-container page-body"]').contains('Checkmk').click();
  cy.contains('Delete').click();
  cy.get('button[aria-label="Confirm Modal Danger Button"]').click();

  cy.contains('No data sources defined').should('be.visible');
});

Cypress.Commands.add('saveDashboard', () => {
  const randInt = Math.floor(Math.random() * 1000).toString();

  cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
  cy.get('input[aria-label="Save dashboard title field"]').type(' ' + randInt);

  cy.get('button[aria-label="Save dashboard button"]').click();
  cy.contains('Dashboard saved').should('be.visible');

  return cy.wrap(randInt);
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginGrafana(): Chainable<void>;
      addNewPanel(): Chainable<void>;
      addCmkDatasource(cmkUser: string, cmkPass: string): Chainable<void>;
      rmCmkDatasource(): Chainable<void>;
      saveDashboard(): Chainable<string>;
    }
  }
}
