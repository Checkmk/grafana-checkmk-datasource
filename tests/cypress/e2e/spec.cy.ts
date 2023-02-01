import '../support/api_commands';
import '../support/commands';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  const CmkCEE = 'Enterprise Editions';
  const CmkCRE = 'RAW Edition';

  const inputDatasourceId = 'data-source-picker';
  const inputFilterId = 'react-select-7-input';
  const inputGraphId = 'input_Predefined graph';
  const inputGraphTypeId = 'input_Graph type';
  const inputHostId = 'input_Hostname';
  const inputMetricId = 'input_Single metric';
  const inputServiceId = 'input_Service';
  const inputSiteId = 'input_Site';

  const inputHostRegexSelector = 'input[data-test-id="host_name_regex-filter-input"]';
  const inputServiceRegexSelector = 'input[data-test-id="service_regex-filter-input"]';

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
    cy.addCmkDatasource(cmkUser, cmkPassword, CmkCEE);
    cy.addCmkDatasource(cmkUser, cmkPassword, CmkCRE);
  });

  after(() => {
    cy.rmCmkDatasource(CmkCEE);
    cy.rmCmkDatasource(CmkCRE);
    cy.contains('No data sources defined').should('be.visible');

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
  describe('CEE tests', () => {
    it('time-usage panel by service (single host)', {}, () => {
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used

      cy.inputLocatorById(inputFilterId).type('Hostname{enter}'); // Filter -> 'Host name'
      cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'

      cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
      cy.contains(hostName0).should('exist');

      cy.inputLocatorById(inputServiceId).type('{enter}'); // Service -> 'Check_MK' (first entry)
      cy.contains('Check_MK').should('exist');

      cy.inputLocatorById(inputGraphId).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
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
      cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'

      // Assert the filter is not set
      cy.get(queryEditorSelector).contains('Type to trigger search').should('exist');
    });

    it('time-usage panel by service (multiple hosts)', {}, () => {
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'

      cy.inputLocatorById(inputServiceId).type('{enter}'); // Service -> 'Check_MK' (first entry)
      cy.contains('Check_MK').should('exist');

      cy.inputLocatorById(inputGraphId).click();
      cy.get('[class="scrollbar-view"]')
        .children()
        .its('length')
        .then(($dropdownLength) => {
          cy.inputLocatorById(inputGraphId).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
          cy.contains('Time usage by phase').should('exist');

          // assert legend elements (not all plots have a legend)
          cy.assertLegendElement('CPU time in user space, ' + hostName0);
          cy.assertLegendElement('CPU time in operating system, ' + hostName0);
          cy.assertLegendElement('CPU time in user space, ' + hostName1);
          cy.assertLegendElement('CPU time in operating system, ' + hostName1);

          cy.assertHoverSelectorsOff(8);
          cy.assertHoverSelectorsOn(8);

          cy.get('[class="css-1a8393j-button"]').eq(3).click(); // Remove filter by service (TODO: introduce new button ID)

          cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service regex'
          cy.contains('Service regex').should('exist');

          cy.get(inputServiceRegexSelector).type('CPU{enter}'); // Service regex -> 'CPU utilization (one entry only)'
          cy.contains('CPU').should('exist');
          cy.get('[class="scrollbar-view"]').children().its('length').should('be.gte', $dropdownLength);
        });
    });

    it('RAM-used panel by service regex (multiple hosts)', {}, () => {
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service'
      cy.contains('Service regex').should('exist');

      cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
      cy.get('input[value="Memory"]').should('exist');

      cy.inputLocatorById(inputGraphId).click(); // Predefined graph -> 'RAM used'
      cy.contains('RAM used').click();
      cy.contains('RAM used').should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Host labels{enter}'); // Filter -> 'Host labels'
      cy.contains('Host labels').should('exist');

      cy.inputLocatorById('react-select-15-input').type('{enter}'); // Host labels -> 'cmk/site:cmk' (one entry)
      cy.contains('cmk/site:cmk').should('exist');

      cy.inputLocatorById(inputGraphTypeId).click(); // Graph type -> 'Single metric'
      cy.contains('Single metric').click();
      cy.contains('Single metric').should('exist');

      cy.inputLocatorById(inputGraphId).should('not.exist');

      cy.inputLocatorById(inputMetricId).click(); // Metric -> 'RAM used'
      cy.contains('RAM used').click();
      cy.contains('RAM used').should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('RAM-used panel by service regex and hostname regex', {}, () => {
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service'
      cy.contains('Service regex').should('exist');

      cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
      cy.get('input[value="Memory"]').should('exist');

      cy.inputLocatorById(inputGraphId).click(); // Predefined graph -> 'RAM used'
      cy.contains('RAM used').click();
      cy.contains('RAM used').should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);

      cy.inputLocatorById(inputFilterId).type('Hostname regex{enter}'); // Filter -> 'Hostname regex'
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
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Hostname{enter}'); // Filter -> 'Host name'

      cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
      cy.contains(hostName0).should('exist');

      cy.inputLocatorById(inputGraphId).type('Uptime{enter}'); // Predefined graph -> 'Uptime' (no entry expected)
      cy.contains('No options found').should('exist');
      cy.get('body').click();

      cy.inputLocatorById(inputGraphTypeId).click();
      cy.contains('Single metric').click();

      cy.inputLocatorById(inputMetricId).click(); // Single metric input -> 'Uptime' (single entry expected)
      cy.contains('Uptime').click();
      cy.contains('Uptime').should('be.visible');

      cy.assertLegendElement('Uptime');

      cy.assertHoverSelectorsOff(1);
      cy.assertHoverSelectorsOn(1);
    });
  });
  describe('CRE tests', () => {
    it('time-usage panel by service (single host)', {}, () => {
      cy.passOnException('ResizeObserver loop limit exceeded');
      cy.inputLocatorById(inputDatasourceId).type('Checkmk ' + CmkCRE + '{enter}');
      cy.contains('Checkmk ' + CmkCRE).should('be.visible');

      cy.inputLocatorById(inputSiteId).type('{enter}'); // Site -> All Sites (first entry)

      cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
      cy.contains(hostName0).should('exist');

      cy.inputLocatorById(inputServiceId).type('{enter}'); // Service -> 'Check_MK' (first entry)
      cy.contains('Check_MK').should('exist');

      cy.inputLocatorById(inputGraphId).type('{enter}'); // Predefined graph -> 'Time usage by phase' (one entry)
      cy.contains('Time usage by phase').should('exist');

      cy.assertLegendElement('CPU time in user space');
      cy.assertLegendElement('CPU time in operating system');
      cy.assertLegendElement('Time spent waiting for Checkmk agent');
      cy.assertLegendElement('Total execution time');

      cy.assertHoverSelectorsOff(4);
      cy.assertHoverSelectorsOn(4);
    });
  });
});
