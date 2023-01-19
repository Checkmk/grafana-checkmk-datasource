import {
  activateCmkChanges,
  createCmkAutomationUser,
  createCmkHost,
  deleteCmkAutomationUser,
  deleteCmkHost,
  executeServiceDiscovery,
} from './api_helpers';
import {
  addCmkDatasource,
  addNewPanel,
  inputFilterSelector,
  inputGraphTypeSelector,
  inputHostLabelsSelector,
  inputHostRegexSelector,
  inputHostSelector,
  inputMetricSelector,
  inputServiceRegexSelector,
  inputServiceSelector,
  inputTemplateSelector,
  loginGrafana,
  panelContentSelector,
  rmCmkDatasource,
  saveDashboard,
} from './helpers';

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

    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addCmkDatasource(cmkUser, cmkPassword);
  });

  it('time-usage panel by service (single host)', {}, () => {
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

    cy.get(panelContentSelector).contains('CPU time in user space').should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    saveDashboard(randInt.toString());
  });

  it('time-usage panel by service (multiple hosts)', {}, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addNewPanel();

    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.get(panelContentSelector)
      .contains('CPU time in user space, ' + hostName0)
      .should('be.visible');
    cy.get(panelContentSelector)
      .contains('CPU time in user space, ' + hostName1)
      .should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    saveDashboard(randInt.toString());
  });

  it('RAM-used panel by service regex (multiple hosts)', {}, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addNewPanel();

    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputTemplateSelector).click(); // Template -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    saveDashboard(randInt.toString());
  });

  it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addNewPanel();

    cy.get(inputFilterSelector).type('Host labels{enter}'); // Filter -> 'Host labels'
    cy.contains('Host labels').should('exist');

    cy.get(inputHostLabelsSelector).type('{enter}'); // Host labels -> 'cmk/site:cmk' (one entry)
    cy.contains('cmk/site:cmk').should('exist');

    cy.get(inputGraphTypeSelector).click(); // Graph type -> 'Single metric'
    cy.contains('Single metric').click();
    cy.contains('Single metric').should('exist');

    cy.get(inputTemplateSelector).should('not.exist');

    cy.get(inputMetricSelector).click(); // Metric -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    const randInt = Math.floor(Math.random() * 1000);
    saveDashboard(randInt.toString());
  });

  it('RAM-used panel by service regex and hostname regex', {}, () => {
    loginGrafana(Cypress.env('grafanaUsername'), Cypress.env('grafanaPassword'));
    addNewPanel();

    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputTemplateSelector).click(); // Template -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    cy.get(inputFilterSelector).type('Hostname regex{enter}'); // Filter -> 'Hostname regex'
    cy.contains('Hostname regex').should('exist');

    cy.get(inputHostRegexSelector).type(hostName0 + '{enter}'); // Hostname regex -> {hostname0}
    cy.get('input[value="' + hostName0 + '"]').should('exist');

    // expecting a change in the panel
    cy.get(panelContentSelector).contains('RAM used').should('be.visible');

    cy.get(inputHostRegexSelector).type('|' + hostName1 + '{enter}'); // Hostname regex -> '{hostname0}|{hostname1}'
    cy.get('input[value="' + hostName0 + '|' + hostName1 + '"]').should('exist');

    // expecting a change in the panel
    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    // TODO: perform assertion over changing in plotted data, once available
  });

  after(function () {
    rmCmkDatasource();

    deleteCmkHost(hostName0);
    deleteCmkHost(hostName1);

    deleteCmkAutomationUser(cmkUser, cmkPassword);
    activateCmkChanges('cmk');
  });
});
