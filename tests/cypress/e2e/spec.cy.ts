import '../support/api_commands';
import CheckmkSelectors from '../support/checkmk_selectors';
import '../support/commands';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  const CmkCEE = 'Commercial editions';
  const CmkCRE = 'Raw Edition';

  const inputDatasourceId = 'data-source-picker';
  const inputFilterId = CheckmkSelectors.AddDashboard.filterFieldId;
  const inputGraphId = 'input_Predefined_graph';
  const inputGraphTypeId = 'input_Graph_type';
  const inputHostId = 'input_Hostname';
  const inputMetricId = 'input_Single_metric';
  const inputServiceId = 'input_Service';
  const inputSiteId = 'input_Site';
  const inputHostLabelId = CheckmkSelectors.AddDashboard.hostLabelFieldId;

  const inputHostRegexDataTestId = 'host_name_regex-filter-input';
  const inputServiceRegexDataTestId = 'service_regex-filter-input';

  const queryEditorSelector = '[class="query-editor-row"]';

  let cmkSite = 'cmk';

  before(() => {
    //Determine site name from variables
    const grafanaCMKSite = Cypress.env('grafanaToCheckmkUrl')
      ? new URL(Cypress.env('grafanaToCheckmkUrl')).pathname.split('/').pop()
      : 'cmk';

    const cypressCMKSite = Cypress.env('cypressToCheckmkUrl')
      ? new URL(Cypress.env('cypressToCheckmkUrl')).pathname.split('/').pop()
      : 'cmk';

    if (grafanaCMKSite !== cypressCMKSite) {
      console.log('Site name mismatch between grafanaToCheckmkUrl and cypressToCheckmkUrl');
      console.log({ grafanaCMKSite, cypressCMKSite });
      throw new Error('grafanaToCheckmkUrl and cypressToCheckmkUrl must have the same site name');
    }

    cmkSite = grafanaCMKSite;
    console.log(`Site name is "${cmkSite}"`);

    cy.deleteCmkAutomationUser(false); // clean-up possible existing user
    cy.createCmkAutomationUser();

    cy.deleteCmkHost(hostName0, false);
    cy.createCmkHost(hostName0);
    cy.deleteCmkHost(hostName1, false);
    cy.createCmkHost(hostName1);

    cy.executeServiceDiscovery(hostName0, 'refresh');
    cy.executeServiceDiscovery(hostName0, 'fix_all');
    cy.executeServiceDiscovery(hostName1, 'refresh');
    cy.executeServiceDiscovery(hostName1, 'fix_all');
    cy.activateCmkChanges(cmkSite);
    cy.waitForPendingServices(2000);

    cy.loginGrafana();
    cy.addCmkDatasource(cmkUser, cmkPassword, CmkCEE);
    cy.addCmkDatasource(cmkUser, cmkPassword, CmkCRE);
    cy.logoutGrafana();
  });

  after(() => {
    cy.rmAllDataSources();
    cy.deleteCmkHost(hostName0);
    cy.deleteCmkHost(hostName1);
    cy.deleteCmkAutomationUser(true);
    cy.activateCmkChanges(cmkSite);
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
      cy.selectDataSource(CmkCEE);

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
      cy.selectDataSource(CmkCEE);

      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service{enter}'); // Filter -> 'Service'

      cy.inputLocatorById(inputServiceId).type('{enter}'); // Service -> 'Check_MK' (first entry)
      cy.contains('Check_MK').should('exist');

      cy.inputLocatorById(inputFilterId).type('regex{enter}'); // Filter -> 'Hostname regex'
      cy.get('input[data-test-id="host_name_regex-filter-input"]').type('localhost_grafana[0-9]+{enter}');

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

          cy.get('[data-test-id="cmk-oac-minus-button-Service"]').click(); // Remove filter by service

          cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service regex'
          cy.contains('Service regex').should('exist');

          cy.inputLocatorByDataTestId(inputServiceRegexDataTestId).type('CPU{enter}'); // Service regex -> 'CPU utilization (one entry only)'
          cy.contains('CPU').should('exist');
          cy.get('[class="scrollbar-view"]').children().its('length').should('be.gte', $dropdownLength);
        });
    });

    it('RAM-used panel by service regex (multiple hosts)', {}, () => {
      cy.selectDataSource(CmkCEE);
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service'
      cy.contains('Service regex').should('exist');

      cy.inputLocatorByDataTestId(inputServiceRegexDataTestId).type('Memory{enter}'); // Service regex -> 'Memory'
      cy.get('input[value="Memory"]').should('exist');
      cy.expectSpinners();

      cy.inputLocatorById(inputGraphId).click(); // Predefined graph -> 'RAM used'
      cy.get('[aria-label="Select options menu"]').contains('RAM used').click();
      cy.contains(/^RAM used$/).should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
      cy.selectDataSource(CmkCEE);
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Host labels{enter}'); // Filter -> 'Host labels'
      cy.contains('Host labels').should('exist');

      cy.inputLocatorById(inputHostLabelId).type('cmk/site:cm'); // Host labels -> 'cmk/site:cm' (one entry)
      // TODO: should only contain a single lable, but shows all?
      cy.contains(`cmk/site:${cmkSite}`).should('exist');
      cy.contains(`cmk/site:${cmkSite}`).click();

      cy.inputLocatorById(inputGraphTypeId).click(); // Graph type -> 'Single metric'
      cy.contains('Single metric').click();
      cy.contains('Single metric').should('exist');

      cy.inputLocatorById(inputGraphId).should('not.exist');

      cy.inputLocatorById(inputMetricId).click(); // Metric -> 'RAM used'
      cy.get('[aria-label="Select options menu"]').contains('RAM used').click();
      cy.contains(/^RAM used$/).should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('RAM-used panel by service regex and hostname regex', {}, () => {
      cy.selectDataSource(CmkCEE);
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Service regex{enter}'); // Filter -> 'Service'
      cy.contains('Service regex').should('exist');

      cy.inputLocatorByDataTestId(inputServiceRegexDataTestId).type('Memory{enter}'); // Service regex -> 'Memory'
      cy.get('input[value="Memory"]').should('exist');
      cy.expectSpinners();

      cy.inputLocatorById(inputGraphId).click(); // Predefined graph -> 'RAM used'
      cy.get('[aria-label="Select options menu"]').contains('RAM used').click();
      cy.contains(/^RAM used$/).should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);

      cy.inputLocatorById(inputFilterId).type('Hostname regex{enter}'); // Filter -> 'Hostname regex'
      cy.contains('Hostname regex').should('exist');

      cy.inputLocatorByDataTestId(inputHostRegexDataTestId).type(hostName0 + '{enter}'); // Hostname regex -> {hostname0}
      cy.get('input[value="' + hostName0 + '"]').should('exist');

      // assert legend elements (expecting a change in the panel)
      cy.assertLegendElement('RAM used');

      cy.assertHoverSelectorsOff(1);
      cy.assertHoverSelectorsOn(1);

      cy.inputLocatorByDataTestId(inputHostRegexDataTestId).type('|' + hostName1 + '{enter}'); // Hostname regex -> '{hostname0}|{hostname1}'
      cy.get('input[value="' + hostName0 + '|' + hostName1 + '"]').should('exist');

      // assert legend elements (expecting a change in the panel)
      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('Uptime panel by hostname', {}, () => {
      cy.selectDataSource(CmkCEE);
      cy.contains('Checkmk ' + CmkCEE).should('be.visible'); // Assert Cmk CEE datasource is used
      cy.inputLocatorById(inputFilterId).type('Hostname{enter}'); // Filter -> 'Host name'

      cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
      cy.contains(hostName0).should('exist');

      cy.inputLocatorById(inputGraphId).type('Uptime{enter}'); // Predefined graph -> 'Uptime' (no entry expected)
      cy.contains('No options found').should('exist');
      cy.get('body').click();

      cy.inputLocatorById(inputGraphTypeId).click();
      cy.contains('Single metric').click();
      cy.expectSpinners();

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
      cy.selectDataSource(CmkCRE);

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

      cy.contains("Could not find 'cmk_cpu_time_by_phase'").should('not.exist');

      cy.inputLocatorById(inputServiceId).click(); // Service -> 'Memory'
      cy.contains('Memory').click();
      cy.contains('Memory').should('exist');

      cy.contains("Could not find 'cmk_cpu_time_by_phase'").should('be.visible'); // Assert previous graph input not visible
    });
    it('Used-RAM panel by service (single host)', {}, () => {
      cy.selectDataSource(CmkCRE);

      cy.passOnException('ResizeObserver loop limit exceeded');
      cy.inputLocatorById(inputDatasourceId).type('Checkmk ' + CmkCRE + '{enter}');
      cy.contains('Checkmk ' + CmkCRE).should('be.visible');

      cy.inputLocatorById(inputSiteId).type('{enter}'); // Site -> All Sites (first entry)

      cy.inputLocatorById(inputHostId).type('{enter}'); // Hostname -> hostName0 (first entry)
      cy.contains(hostName0).should('exist');

      cy.inputLocatorById(inputServiceId).click(); // Service -> 'Memory'
      cy.contains('Memory').click();
      cy.contains('Memory').should('exist');

      cy.inputLocatorById(inputGraphId).click(); // Predefined graph -> 'Used RAM'
      cy.contains('Used RAM').click();
      cy.contains('Used RAM').should('exist');

      cy.assertLegendElement('RAM used %'); // TODO: Getting 'RAM used %'. Should the graph name match the metric?

      cy.assertHoverSelectorsOff(1);
      cy.assertHoverSelectorsOn(1);
    });
  });
});
