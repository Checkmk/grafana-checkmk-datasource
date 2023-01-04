import {
  activateCmkChanges,
  createCmkAutomationUser,
  createCmkHost,
  deleteCmkHost,
  deleteCmkAutomationUser,
  executeServiceDiscovery,
} from './api_helpers';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  before(function () {
    deleteCmkAutomationUser(cmkUser, cmkPassword, false); // clean-up possible existing user
    createCmkAutomationUser(cmkUser, cmkPassword);

    createCmkHost(hostName0);
    createCmkHost(hostName1);

    executeServiceDiscovery(hostName0, 'new');
    executeServiceDiscovery(hostName1, 'new');
    activateCmkChanges('cmk');
  });

  it('configures the datasource correctly', () => {
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
    cy.contains('Data source is working').should('be.visible');
  });

  it('time-usage panel by service (single host)', { defaultCommandTimeout: 10000, retries: 2 }, () => {
    cy.visit('/');
    cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
    cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
    cy.get('[aria-label="Login button"]').click();

    cy.visit('/dashboard/new');
    cy.get('button[aria-label="Add new panel"]').click();

    cy.get('input[id="react-select-7-input"]').type('Hostname{enter}'); // Filter -> 'Host name'
    cy.get('input[id="react-select-7-input"]').type('Service{enter}'); // Filter -> 'Service'

    cy.get('input[id="input_Hostname"]').type('{enter}'); // Hostname -> hostName0 (first entry)
    cy.contains(hostName0).should('exist');

    cy.get('input[id="input_Service"]').type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get('input[id="input_Template"]').type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.get('[class="panel-content"]').should('be.visible');
    cy.contains('CPU time in user space').should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
    cy.get('input[aria-label="Save dashboard title field"]').type(' ' + randInt);

    cy.get('button[aria-label="Save dashboard button"]').click();
    cy.contains('Dashboard saved').should('be.visible');
  });

  it('time-usage panel by service (multiple hosts)', { defaultCommandTimeout: 10000, retries: 2 }, () => {
    cy.visit('/');
    cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
    cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
    cy.get('[aria-label="Login button"]').click();

    cy.visit('/dashboard/new');
    cy.get('button[aria-label="Add new panel"]').click();

    cy.get('input[id="react-select-7-input"]').type('Service{enter}'); // Filter -> 'Service'

    cy.get('input[id="input_Service"]').type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get('input[id="input_Template"]').type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.contains('CPU time in user space, ' + hostName0).should('be.visible');
    cy.contains('CPU time in user space, ' + hostName1).should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
    cy.get('input[aria-label="Save dashboard title field"]').type(' ' + randInt);

    cy.get('button[aria-label="Save dashboard button"]').click();
    cy.contains('Dashboard saved').should('be.visible');
  });

  after(function () {
    deleteCmkHost(hostName0);
    deleteCmkHost(hostName1);

    deleteCmkAutomationUser(cmkUser, cmkPassword);
    activateCmkChanges('cmk');
  });
});
