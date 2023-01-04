import { loginGrafana, addCmkDatasource, saveDashboard } from './helpers';

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

    addCmkDatasource(cmkUser, cmkPassword, Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
  });

  it('time-usage panel by service (single host)', { defaultCommandTimeout: 10000, retries: 2 }, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));

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
    saveDashboard(randInt.toString());
  });

  it('time-usage panel by service (multiple hosts)', { defaultCommandTimeout: 10000, retries: 2 }, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));

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
    saveDashboard(randInt.toString());
  });

  after(function () {
    deleteCmkHost(hostName0);
    deleteCmkHost(hostName1);

    deleteCmkAutomationUser(cmkUser, cmkPassword);
    activateCmkChanges('cmk');
  });
});
