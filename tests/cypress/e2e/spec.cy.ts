import {
  activateCmkChanges,
  createCmkAutomationUser,
  createCmkHost,
  deleteCmkHost,
  deleteCmkAutomationUser,
} from './helpers';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  before(function () {
    deleteCmkAutomationUser(cmkUser, cmkPassword, false); // clean-up possible existing user
    createCmkAutomationUser(cmkUser, cmkPassword);
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

  it('create and delete host', () => {
    const hostName = 'localhost_' + Math.floor(Date.now() / 1000);

    createCmkHost(hostName);
    activateCmkChanges('cmk');

    deleteCmkHost(hostName);
    activateCmkChanges('cmk');
  });

  it(
    'create a new time-usage panel',
    {
      defaultCommandTimeout: 10000,
      retries: 0,
    },
    () => {
      const randID = Math.floor(Date.now() / 1000);
      const hostName = 'localhost_' + randID;

      createCmkHost(hostName);
      activateCmkChanges('cmk');

      cy.visit('/');
      cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
      cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
      cy.get('[aria-label="Login button"]').click();

      cy.visit('/dashboard/new');
      cy.get('button[aria-label="Add new panel"]').click();

      cy.get('input[id="react-select-7-input"]').type('Host name{enter}'); // Filter -> 'Host name'

      // cy.get('input[id="input_Host"]').type(hostName); // Hostname -> <current host>
      cy.get('input[id="input_Host"]').type('{enter}');
      cy.contains(hostName).should('be.visible');

      cy.get('[class="panel-content"]').should('be.visible');

      cy.get('input[id="input_Template"]').type('{enter}'); // Template -> Time usage by phase (one entry)
      cy.get('[aria-label="VizLegend series CPU time in user space"]').should('be.visible');

      cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
      cy.get('input[aria-label="Save dashboard title field"]').type(' ' + randID);

      cy.get('button[aria-label="Save dashboard button"]').click();
      cy.contains('Dashboard saved').should('be.visible');

      deleteCmkHost(hostName);
      activateCmkChanges('cmk');
    }
  );

  after(function () {
    // deleteCmkAutomationUser(cmkUser, cmkPassword);
    // activateCmkChanges('cmk');
  });
});
