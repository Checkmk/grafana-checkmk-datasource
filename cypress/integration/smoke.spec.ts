import { e2e } from '@grafana/e2e';

import { selectors } from '../../src/selectors';
import '../support/api_commands';

const e2eselectors = e2e.getSelectors(selectors);

const populateEnv = (env: Record<string, string>) => {
  Object.entries(env).forEach(([key, value]) => {
    Cypress.env(key, value);
  });
};

const addCheckmkDatasource = (config: {
  url: string;
  edition: string;
  backend: string;
  username: string;
  secret: string;
}) => {
  return e2e.flows.addDataSource({
    expectedAlertMessage: 'Data source is working',
    form: () => {
      e2eselectors.components.ConfigEditor.backedUrl().type(config.url);
      e2eselectors.components.ConfigEditor.edition().type(config.edition + '{enter}');
      e2eselectors.components.ConfigEditor.backend().type(config.backend + '{enter}');
      e2eselectors.components.ConfigEditor.username().type(config.username);
      e2eselectors.components.ConfigEditor.secret().type(config.secret);
    },
    timeout: 1000,
    type: 'Checkmk',
  });
};

describe('Smoke test', () => {
  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  before(() => {
    e2e()
      .readProvisions(['datasources/env.yaml'])
      .then((provisions) => populateEnv(provisions[0]));

    cy.deleteCmkAutomationUser(false); // clean-up possible existing user
    cy.createCmkAutomationUser();

    // cy.deleteCmkHost(hostName0, false)
    cy.createCmkHost(hostName0);
    // cy.deleteCmkHost(hostName1, false)
    cy.createCmkHost(hostName1);

    cy.executeServiceDiscovery(hostName0, 'refresh');
    cy.executeServiceDiscovery(hostName0, 'fix_all');
    cy.executeServiceDiscovery(hostName1, 'refresh');
    cy.executeServiceDiscovery(hostName1, 'fix_all');
    cy.activateCmkChanges('cmk');
    cy.waitForPendingServices(10000);
  });

  it('time-usage panel by service (single host)', () => {
    e2e.flows.login();
    e2e()
      .readProvisions(['datasources/checkmk.yaml'])
      .then((config) => {
        addCheckmkDatasource(config[0]);
      });
    const {Filters} = e2eselectors.components.QueryEditor

    Filters.addFilter().type('Hostname{enter}'); // Filter -> 'Host name'
    cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'
    //
    // cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
    // cy.contains(hostName0).should('exist');
    //
    // cy.inputLocatorById(inputServiceId).type('{enter}'); // Service -> 'Check_MK' (first entry)
    // cy.contains('Check_MK').should('exist');
    //
    // cy.inputLocatorById(inputGraphId).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
    // cy.contains('Time usage by phase').should('exist');
    //
    // cy.assertLegendElement('CPU time in user space');
    // cy.assertLegendElement('CPU time in operating system');
    // cy.assertLegendElement('Time spent waiting for Checkmk agent');
    // cy.assertLegendElement('Total execution time');
    //
    // cy.assertHoverSelectorsOff(4);
    // cy.assertHoverSelectorsOn(4);
    //
    // // Assert all filters are set
    // cy.get(queryEditorSelector).contains('Type to trigger search').should('not.exist');
    //
    // cy.get(queryEditorSelector).find('button').eq(0).click(); // Remove filter by hostname
    // cy.get(queryEditorSelector).find('button').click(); // Remove filter by service
    // cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'
    //
    // // Assert the filter is not set
    // cy.get(queryEditorSelector).contains('Type to trigger search').should('exist');
  });
});
