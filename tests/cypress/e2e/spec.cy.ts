import '../support/api_commands';
import '../support/commands';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  const inputFilterSelector = 'input[id="react-select-7-input"]';
  const inputGraphTypeSelector = 'input[id="input_Graph type"]';
  const inputHostLabelsSelector = 'input[id="react-select-15-input"]';
  const inputHostRegexSelector = 'input[data-test-id="host_name_regex-filter-input"]';
  const inputHostSelector = 'input[id="input_Hostname"]';
  const inputMetricSelector = 'input[id="input_Single metric"]';
  const inputServiceRegexSelector = 'input[data-test-id="service_regex-filter-input"]';
  const inputServiceSelector = 'input[id="input_Service"]';
  const inputTemplateSelector = 'input[id="input_Predefined graph"]';
  const panelContentSelector = '[class="panel-content"]';
  const plottedHoverSelectorOff = '[class="u-cursor-pt u-off"]';
  const plottedHoverSelectorOn = '[class="u-cursor-pt"]';

  before(() => {
    cy.deleteCmkAutomationUser(false); // clean-up possible existing user
    cy.createCmkAutomationUser();

    cy.createCmkHost(hostName0);
    cy.createCmkHost(hostName1);

    cy.executeServiceDiscovery(hostName0, 'new');
    cy.executeServiceDiscovery(hostName1, 'new');
    cy.activateCmkChanges('cmk');

    cy.loginGrafana();
    cy.addCmkDatasource(cmkUser, cmkPassword);
  });

  after(() => {
    cy.rmCmkDatasource();

    cy.deleteCmkHost(hostName0);
    cy.deleteCmkHost(hostName1);

    cy.deleteCmkAutomationUser(true);
    cy.activateCmkChanges('cmk');
  });

  beforeEach(() => {
    cy.loginGrafana();
    cy.addNewPanel();
  });

  afterEach(() => {
    cy.saveDashboard();
    // TODO: remove created dashboard. Once done, pseuso-random dashboard name can be removed.
  });

  it('time-usage panel by service (single host)', {}, () => {
    cy.get(inputFilterSelector).type('Hostname{enter}'); // Filter -> 'Host name'
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputHostSelector).type('{enter}'); // Hostname -> hostName0 (first entry)
    cy.contains(hostName0).should('exist');

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    // assert legend elements
    cy.get(panelContentSelector).contains('CPU time in user space').should('be.visible');
    cy.get(panelContentSelector).contains('CPU time in operating system').should('be.visible');
    cy.get(panelContentSelector).contains('Time spent waiting for Checkmk agent').should('be.visible');
    cy.get(panelContentSelector).contains('Total execution time').should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 4);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 4);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);
  });

  it('time-usage panel by service (multiple hosts)', {}, () => {
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    // assert legend elements (not all plots have a legend)
    cy.get(panelContentSelector)
      .contains('CPU time in user space, ' + hostName0)
      .should('be.visible');
    cy.get(panelContentSelector)
      .contains('CPU time in operating system, ' + hostName0)
      .should('be.visible');
    cy.get(panelContentSelector);
    cy.get(panelContentSelector)
      .contains('CPU time in user space, ' + hostName1)
      .should('be.visible');
    cy.get(panelContentSelector)
      .contains('CPU time in operating system, ' + hostName1)
      .should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 8);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 8);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);
  });

  it('RAM-used panel by service regex (multiple hosts)', {}, () => {
    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputTemplateSelector).click(); // Template -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    // assert legend elements
    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 2);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 2);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);
  });

  it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
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

    // assert legend elements
    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 2);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 2);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);
  });

  it('RAM-used panel by service regex and hostname regex', {}, () => {
    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputTemplateSelector).click(); // Template -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    // assert legend elements
    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 2);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 2);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);

    cy.get(inputFilterSelector).type('Hostname regex{enter}'); // Filter -> 'Hostname regex'
    cy.contains('Hostname regex').should('exist');

    cy.get(inputHostRegexSelector).type(hostName0 + '{enter}'); // Hostname regex -> {hostname0}
    cy.get('input[value="' + hostName0 + '"]').should('exist');

    // assert legend elements (expecting a change in the panel)
    cy.get(panelContentSelector).contains('RAM used').should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 1);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 1);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);

    cy.get(inputHostRegexSelector).type('|' + hostName1 + '{enter}'); // Hostname regex -> '{hostname0}|{hostname1}'
    cy.get('input[value="' + hostName0 + '|' + hostName1 + '"]').should('exist');

    // assert legend elements (expecting a change in the panel)
    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    // assert number of plots via hover elements
    cy.get(plottedHoverSelectorOff).should('have.length', 2);

    // click on the panel (uncaught exception raised in the CI)
    cy.passOnException('ResizeObserver loop limit exceeded');
    cy.get(panelContentSelector).click();

    // assert changes in the hover elements
    cy.get(plottedHoverSelectorOn).should('have.length', 2);
    cy.get(plottedHoverSelectorOff).should('have.length', 0);
  });
});
