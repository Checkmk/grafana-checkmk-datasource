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
  const inputGraphSelector = 'input[id="input_Predefined graph"]';
  const queryEditorSelector = '[class="query-editor-row"]';

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

    cy.get(inputGraphSelector).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.assertLegendElement('CPU time in user space');
    cy.assertLegendElement('CPU time in operating system');
    cy.assertLegendElement('Time spent waiting for Checkmk agent');
    cy.assertLegendElement('Total execution time');

    cy.assertHoverSelectorsOff(4);
    cy.assertHoverSelectorsOn(4);

    // Assert all filters are set
    cy.get(queryEditorSelector).contains('Type to trigger search').should('not.exist');

    cy.get(queryEditorSelector).find('button').eq(0).click(); // Remove filter by hostname
    cy.get(queryEditorSelector).find('button').click(); // Remove filter by service
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    // Assert the filter is not set
    cy.get(queryEditorSelector).contains('Type to trigger search').should('exist');
  });

  it('time-usage panel by service (multiple hosts)', {}, () => {
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputGraphSelector).click();
    cy.get('[class="scrollbar-view"]')
      .children()
      .its('length')
      .then(($dropdownLength) => {
        cy.get(inputGraphSelector).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
        cy.contains('Time usage by phase').should('exist');

        // assert legend elements (not all plots have a legend)
        cy.assertLegendElement('CPU time in user space, ' + hostName0);
        cy.assertLegendElement('CPU time in operating system, ' + hostName0);
        cy.assertLegendElement('CPU time in user space, ' + hostName1);
        cy.assertLegendElement('CPU time in operating system, ' + hostName1);

        cy.assertHoverSelectorsOff(8);
        cy.assertHoverSelectorsOn(8);

        cy.get('[class="css-1a8393j-button"]').eq(3).click(); // Remove filter by service (TODO: introduce new button ID)

        cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service regex'
        cy.contains('Service regex').should('exist');

        cy.get(inputServiceRegexSelector).type('CPU{enter}'); // Service regex -> 'CPU utilization (one entry only)'
        cy.contains('CPU').should('exist');
        cy.get('[class="scrollbar-view"]').children().its('length').should('be.gte', $dropdownLength);
      });
  });

  it('RAM-used panel by service regex (multiple hosts)', {}, () => {
    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputGraphSelector).click(); // Predefined graph -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.assertLegendElement(hostName0);
    cy.assertLegendElement(hostName1);

    cy.assertHoverSelectorsOff(2);
    cy.assertHoverSelectorsOn(2);
  });

  it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
    cy.get(inputFilterSelector).type('Host labels{enter}'); // Filter -> 'Host labels'
    cy.contains('Host labels').should('exist');

    cy.get(inputHostLabelsSelector).type('{enter}'); // Host labels -> 'cmk/site:cmk' (one entry)
    cy.contains('cmk/site:cmk').should('exist');

    cy.get(inputGraphTypeSelector).click(); // Graph type -> 'Single metric'
    cy.contains('Single metric').click();
    cy.contains('Single metric').should('exist');

    cy.get(inputGraphSelector).should('not.exist');

    cy.get(inputMetricSelector).click(); // Metric -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.assertLegendElement(hostName0);
    cy.assertLegendElement(hostName1);

    cy.assertHoverSelectorsOff(2);
    cy.assertHoverSelectorsOn(2);
  });

  it('RAM-used panel by service regex and hostname regex', {}, () => {
    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputGraphSelector).click(); // Predefined graph -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.assertLegendElement(hostName0);
    cy.assertLegendElement(hostName1);

    cy.assertHoverSelectorsOff(2);
    cy.assertHoverSelectorsOn(2);

    cy.get(inputFilterSelector).type('Hostname regex{enter}'); // Filter -> 'Hostname regex'
    cy.contains('Hostname regex').should('exist');

    cy.get(inputHostRegexSelector).type(hostName0 + '{enter}'); // Hostname regex -> {hostname0}
    cy.get('input[value="' + hostName0 + '"]').should('exist');

    // assert legend elements (expecting a change in the panel)
    cy.assertLegendElement('RAM used');

    cy.assertHoverSelectorsOff(1);
    cy.assertHoverSelectorsOn(1);

    cy.get(inputHostRegexSelector).type('|' + hostName1 + '{enter}'); // Hostname regex -> '{hostname0}|{hostname1}'
    cy.get('input[value="' + hostName0 + '|' + hostName1 + '"]').should('exist');

    // assert legend elements (expecting a change in the panel)
    cy.assertLegendElement(hostName0);
    cy.assertLegendElement(hostName1);

    cy.assertHoverSelectorsOff(2);
    cy.assertHoverSelectorsOn(2);
  });

  it('Uptime panel by hostname', {}, () => {
    cy.get(inputFilterSelector).type('Hostname{enter}'); // Filter -> 'Host name'

    cy.get(inputHostSelector).type('{enter}'); // Hostname -> hostName0 (first entry)
    cy.contains(hostName0).should('exist');

    cy.get(inputGraphSelector).type('Uptime{enter}'); // Predefined graph -> 'Uptime' (no entry expected)
    cy.contains('No options found').should('exist');
    cy.get('body').click();

    cy.get(inputGraphTypeSelector).click();
    cy.contains('Single metric').click();

    cy.get(inputMetricSelector).click(); // Single metric input -> 'Uptime' (single entry expected)
    cy.contains('Uptime').click();
    cy.contains('Uptime').should('be.visible');

    cy.assertLegendElement('Uptime');

    cy.assertHoverSelectorsOff(1);
    cy.assertHoverSelectorsOn(1);
  });
});
