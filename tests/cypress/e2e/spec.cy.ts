import {
  addCmkDatasource,
  addNewPanel,
  inputFilterSelector,
  inputHostSelector,
  inputServiceSelector,
  inputTemplateSelector,
  loginGrafana,
  saveDashboard,
} from './helpers';

import {
  activateCmkChanges,
  createCmkAutomationUser,
  createCmkHost,
  deleteCmkAutomationUser,
  deleteCmkHost,
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
    addNewPanel();

    cy.get(inputFilterSelector).type('Hostname{enter}'); // Filter -> 'Host name'
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputHostSelector).type('{enter}'); // Hostname -> hostName0 (first entry)
    cy.contains(hostName0).should('exist');

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.get('[class="panel-content"]').should('be.visible');
    cy.contains('CPU time in user space').should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    saveDashboard(randInt.toString());
  });

  it('time-usage panel by service (multiple hosts)', { defaultCommandTimeout: 10000, retries: 2 }, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addNewPanel();

    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
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
