import { createCmkAutomationUser, createCmkHost, deleteCmkHost, activateCmkChanges } from './helpers';

describe('Source configuration', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';
  const hostName = 'localhost_' + Math.floor(Date.now() / 1000);

  it('configures the datasource correctly', () => {
    createCmkAutomationUser(cmkUser, cmkPassword);

    cy.visit('/');
    cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
    cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
    cy.get('[aria-label="Login button"]').click();

    cy.visit('/datasources/new');
    cy.get('button[aria-label="Add data source Checkmk"]').contains('Checkmk').click();

    cy.get('[data-test-id="checkmk-url"]').type(Cypress.env('grafanaToCheckmkUrl'));
    cy.get('[data-test-id="checkmk-username"]').type(cmkUser);
    cy.get('[data-test-id="checkmk-password"]').type(cmkPassword);

    cy.get('[aria-label="Data source settings page Save and Test button"]').click();

    cy.get('[data-testid="data-testid Alert success"]').should('be.visible');
  });

  it('create and delete host', () => {
    createCmkHost(hostName);
    activateCmkChanges('cmk');

    deleteCmkHost(hostName);
    activateCmkChanges('cmk');
  });
});
