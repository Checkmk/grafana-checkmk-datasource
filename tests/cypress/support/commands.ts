import CheckMkSelectors from './checkmk_selectors';
import GrafanaSelectors from './grafana_selectors';

export {};

const panelContentSelector = '[class$="panel-content"]';
const panelHoverSelector = '[class="u-over"]';
const plottedHoverSelectorOff = '[class="u-cursor-pt u-off"]';
const plottedHoverSelectorOn = '[class="u-cursor-pt"]';

Cypress.Commands.add('loginGrafana', () => {
  cy.visit('/login');
  cy.get(GrafanaSelectors.Login.username_input).type(Cypress.env('grafanaUsername'));
  cy.get(GrafanaSelectors.Login.password_input).type(Cypress.env('grafanaPassword'));
  cy.get(GrafanaSelectors.Login.login_button).click();
  // wait until page after logged in is fully loaded
  cy.contains('Recently viewed dashboards').should('be.visible');
});

Cypress.Commands.add('logoutGrafana', () => {
  cy.visit('/logout');
});

Cypress.Commands.add('addNewPanel', () => {
  // add a new panel in a new dashboard
  cy.visit('/dashboard/new');
  cy.get(GrafanaSelectors.AddDashboard.add_new_panel_button).click();
});

Cypress.Commands.add('selectDataSource', (edition: string) => {
  if (GrafanaSelectors.grafanaVersion >= 10) {
    cy.get(`${GrafanaSelectors.AddDashboard.datasources_list}`).contains('button', `Checkmk ${edition}`).click();
  }
});

Cypress.Commands.add('addCmkDatasource', (cmkUser: string, cmkPass: string, edition: string) => {
  cy.visit('/datasources/new');
  cy.get(GrafanaSelectors.AddDataSource.select_datasource_button('Checkmk')).contains('Checkmk').click();

  cy.get(CheckMkSelectors.SetupForm.name).type(' ' + edition);
  cy.get(CheckMkSelectors.SetupForm.url).type(Cypress.env('grafanaToCheckmkUrl'));
  cy.get(CheckMkSelectors.SetupForm.edition).type(edition + '{enter}');
  cy.contains(edition).should('exist');

  cy.get(CheckMkSelectors.SetupForm.username).type(cmkUser);
  cy.get(CheckMkSelectors.SetupForm.password).type(cmkPass);
  cy.get(CheckMkSelectors.SetupForm.version).type('<{enter}');

  cy.get(GrafanaSelectors.AddDataSource.save_and_test_button).click();

  cy.get('[data-testid="data-testid Alert success"]').should('be.visible');
  cy.contains('Data source is working').should('be.visible');
});

Cypress.Commands.add('rmAllDataSources', () => {
  // Remove the previously-created datasource as teardown process.
  // This makes sure the tests use the newly generated datasource in each execution.
  // Important especially when running the tests locally if docker images are up during multiple tests' executions.

  cy.request({
    method: 'GET',
    url: '/api/datasources',
    auth: {
      user: Cypress.env('grafanaUsername'),
      pass: Cypress.env('grafanaPassword'),
    },
  }).then((response) => {
    expect(response.status).is.equal(200);
    for (const ds of response.body) {
      cy.request({
        method: 'DELETE',
        url: `/api/datasources/uid/${ds.uid}`,
        auth: {
          user: Cypress.env('grafanaUsername'),
          pass: Cypress.env('grafanaPassword'),
        },
      }).then((response) => {
        expect(response.status).is.equal(200);
      });
    }
  });
});

Cypress.Commands.add('saveDashboard', () => {
  const randInt = Math.floor(Math.random() * 1000).toString();

  cy.get('button[title="Apply changes and save dashboard"]').contains('Save').click();
  cy.get('input[aria-label="Save dashboard title field"]').type(' ' + randInt);

  cy.get('button[aria-label="Save dashboard button"]').click();
  cy.contains('Dashboard saved').should('be.visible');

  return cy.wrap(randInt);
});

Cypress.Commands.add('passOnException', (errorMessage: string) => {
  // Make the test pass if an uncaught exception with errorMessage is raised
  cy.on('uncaught:exception', (err, runnable) => {
    if (err.message.match(errorMessage)) {
      return false;
    }
  });
});

Cypress.Commands.add('expectSpinners', () => {
  // wait until spinner is visible (dropdown is waiting for data)
  cy.get('div[data-testid="Spinner"]').should('be.visible');
  // wait until spinner is gone (dropdown is populated)
  cy.get('div[data-testid="Spinner"]').should('not.exist');
});

Cypress.Commands.add('assertHoverSelectorsOff', (nSelectors: number) => {
  // assert number of plotlines via hover elements
  cy.get(plottedHoverSelectorOff).should('have.length', nSelectors);
});

Cypress.Commands.add('assertHoverSelectorsOn', (nSelectors: number) => {
  // click on the panel (uncaught exception raised in the CI)
  cy.passOnException('ResizeObserver loop limit exceeded');
  cy.get(panelHoverSelector).click();

  // assert changes in the hover elements
  cy.get(plottedHoverSelectorOn).should('have.length', nSelectors);
  cy.assertHoverSelectorsOff(0);
});

Cypress.Commands.add('assertLegendElement', (text: string) => {
  cy.get(panelContentSelector).contains(text).should('exist');
});

Cypress.Commands.add('inputLocatorById', (id: string) => {
  return cy.get(`input[id="${id}"]`);
});

Cypress.Commands.add('inputLocatorByDataTestId', (dataTestId: string) => {
  return cy.get(`input[data-test-id="${dataTestId}"]`);
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginGrafana(): Chainable<void>;
      logoutGrafana(): Chainable<void>;
      addNewPanel(): Chainable<void>;
      addCmkDatasource(cmkUser: string, cmkPass: string, edition: string): Chainable<void>;
      rmAllDataSources(): Chainable<void>;
      saveDashboard(): Chainable<string>;
      passOnException(errorMessage: string): Chainable<void>;
      expectSpinners(): Chainable<void>;
      assertHoverSelectorsOff(nSelectors: number): Chainable<void>;
      assertHoverSelectorsOn(nSelectors: number): Chainable<void>;
      assertLegendElement(text: string): Chainable<void>;
      inputLocatorById(id: string): Chainable<JQuery>;
      inputLocatorByDataTestId(dataTestId: string): Chainable<JQuery>;
      selectDataSource(edition: string): Chainable<JQuery>;
    }
  }
}
