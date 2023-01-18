// TODO: See top of api_helpers.ts

export const inputFilterSelector = 'input[id="react-select-7-input"]';
export const inputGraphTypeSelector = 'input[id="input_Graph type"]';
export const inputHostLabelsSelector = 'input[id="react-select-15-input"]';
export const inputHostSelector = 'input[id="input_Hostname"]';
export const inputMetricSelector = 'input[id="input_Single metric"]';
export const inputServiceSelector = 'input[id="input_Service"]';
export const inputServiceRegexSelector = 'input[data-test-id="service_regex-filter-input"]';
export const inputTemplateSelector = 'input[id="input_Predefined graph"]';

export function loginGrafana(grafanaUsername: string, passwordGrafana: string) {
  cy.visit('/login');
  cy.get('input[name="user"]').type(grafanaUsername);
  cy.get('input[name="password"]').type(passwordGrafana);
  cy.get('[aria-label="Login button"]').click();
}

export function addNewPanel() {
  // add a new panel in a new dashboard
  cy.visit('/dashboard/new');
  cy.get('button[aria-label="Add new panel"]').click();
}

export function addCmkDatasource(
  cmkUsername: string,
  cmkPassword: string,
  grafanaUsername: string,
  passwordGrafana: string
) {
  loginGrafana(grafanaUsername, passwordGrafana);

  cy.visit('/datasources/new');
  cy.get('button[aria-label="Add data source Checkmk"]').contains('Checkmk').click();

  cy.get('[data-test-id="checkmk-url"]').type(Cypress.env('grafanaToCheckmkUrl'));
  cy.get('[data-test-id="checkmk-username"]').type(cmkUsername);
  cy.get('[data-test-id="checkmk-password"]').type(cmkPassword);
  cy.get('[id="checkmk-version"]').type('<{enter}');

  cy.get('[aria-label="Data source settings page Save and Test button"]').click();

  cy.get('[data-testid="data-testid Alert success"]').should('be.visible');
  cy.contains('Data source is working').should('be.visible');
}

export function saveDashboard(dashboardID: string) {
  cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
  cy.get('input[aria-label="Save dashboard title field"]').type(' ' + dashboardID);

  cy.get('button[aria-label="Save dashboard button"]').click();
  cy.contains('Dashboard saved').should('be.visible');
}
