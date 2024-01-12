import '../support/api_commands';
import CheckmkSelectors from '../support/checkmk_selectors';
import '../support/commands';
import { LabelVariableNames } from '../types';

enum FilterTypes {
  HOSTNAME = 'Hostname',
  HOSTNAME_REGEX = 'Hostname regex',
  HOST_LABELS = 'Host labels',
  SERVICE = 'Service',
  SERVICE_REGEX = 'Service regex',
}

enum Services {
  CHECK_MK = 'Check_MK',
  CPU_REGEX = 'CPU',
  MEMORY_REGEX = 'Memory',
}

enum GraphTypes {
  TIME_BY_PHASE = 'Time usage by phase',
  RAM_USED = 'RAM used',
  UPTIME = 'Uptime',
}

enum Sites {
  ALL_SITES = 'All Sites',
}

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  const CmkCEE = 'Commercial editions';
  const CmkCRE = 'Raw Edition';

  const inputGraphId = 'input_Predefined_graph';
  const inputGraphTypeId = 'input_Graph_type';
  const inputMetricId = 'input_Single_metric';
  const inputHostLabelId = CheckmkSelectors.AddDashboard.hostLabelFieldId;
  const inputCustomLabelSelector = 'input[data-test-id="custom-label-field"]';

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

      cy.addFilter(FilterTypes.HOSTNAME);
      cy.filterByHostname(hostName0);

      cy.addFilter(FilterTypes.SERVICE);
      cy.filterByService(Services.CHECK_MK);

      cy.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

      cy.assertLegendElement('CPU time in user space');
      cy.assertLegendElement('CPU time in operating system');
      cy.assertLegendElement('Time spent waiting for Checkmk agent');
      cy.assertLegendElement('Total execution time');

      cy.assertHoverSelectorsOff(4);
      cy.assertHoverSelectorsOn(4);

      // Assert all filters are set
      cy.get(queryEditorSelector).contains('Type to trigger search').should('not.exist');
      cy.get(queryEditorSelector).find('button').eq(0).click(); // Remove filter by hostname
      cy.get(queryEditorSelector).find('button').eq(0).click(); // Remove filter by service
      cy.addFilter(FilterTypes.SERVICE);

      // Assert the filter is not set
      cy.get(queryEditorSelector).contains('Type to trigger search').should('exist');
    });

    it('time-usage panel by service (multiple hosts)', {}, () => {
      cy.selectDataSource(CmkCEE);

      cy.addFilter(FilterTypes.SERVICE);
      cy.filterByService(Services.CHECK_MK);

      cy.addFilter(FilterTypes.HOSTNAME_REGEX);
      cy.filterByHostnameRegex('localhost_grafana[0-9]+').wait(1000);

      cy.inputLocatorById(CheckmkSelectors.AddDashboard.predefinedGraphFieldId).click();
      cy.get('[class="scrollbar-view"]')
        .children()
        .its('length')
        .then(($dropdownLength) => {
          cy.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

          // assert legend elements (not all plots have a legend)
          cy.assertLegendElement('CPU time in user space, ' + hostName0);
          cy.assertLegendElement('CPU time in operating system, ' + hostName0);
          cy.assertLegendElement('CPU time in user space, ' + hostName1);
          cy.assertLegendElement('CPU time in operating system, ' + hostName1);

          cy.assertHoverSelectorsOff(8);
          cy.assertHoverSelectorsOn(8);

          cy.removeFilterByService();

          cy.addFilter(FilterTypes.SERVICE_REGEX);
          cy.filterByServiceRegex(Services.CPU_REGEX);

          cy.get('[class="scrollbar-view"]').children().its('length').should('be.gte', $dropdownLength);
        });
    });

    it('RAM-used panel by service regex (multiple hosts)', {}, () => {
      cy.selectDataSource(CmkCEE);

      cy.addFilter(FilterTypes.SERVICE_REGEX);
      cy.filterByServiceRegex(Services.MEMORY_REGEX);
      cy.expectSpinners();

      cy.selectPredefinedGraphType(GraphTypes.RAM_USED);

      cy.contains(/^RAM used$/).should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
      cy.selectDataSource(CmkCEE);

      cy.addFilter(FilterTypes.HOST_LABELS);

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

      cy.addFilter(FilterTypes.SERVICE_REGEX);
      cy.filterByServiceRegex(Services.MEMORY_REGEX);
      cy.expectSpinners();

      cy.selectPredefinedGraphType(GraphTypes.RAM_USED);
      cy.contains(/^RAM used$/).should('exist');

      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);

      cy.addFilter(FilterTypes.HOSTNAME_REGEX);
      cy.filterByHostnameRegex(hostName0);

      // assert legend elements (expecting a change in the panel)
      cy.assertLegendElement('RAM used');

      cy.assertHoverSelectorsOff(1);
      cy.assertHoverSelectorsOn(1);

      cy.filterByHostnameRegex(hostName0 + '|' + hostName1);

      // assert legend elements (expecting a change in the panel)
      cy.assertLegendElement(hostName0);
      cy.assertLegendElement(hostName1);

      cy.assertHoverSelectorsOff(2);
      cy.assertHoverSelectorsOn(2);
    });

    it('Uptime panel by hostname', {}, () => {
      cy.selectDataSource(CmkCEE);

      cy.addFilter(FilterTypes.HOSTNAME);
      cy.filterByHostname(hostName0);

      // Predefined graph -> 'Uptime' (no entry expected)
      cy.selectNonExistentPredefinedGraphType(GraphTypes.UPTIME);
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
    it('Custom labels', {}, () => {
      cy.selectDataSource(CmkCEE);

      cy.addFilter(FilterTypes.HOSTNAME);
      cy.filterByHostname(hostName0);

      cy.contains('Predefined graph').should('exist');

      cy.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);
      cy.assertLegendElement(`CPU time in user space`);

      //Label $label
      cy.get(inputCustomLabelSelector).clear().type(LabelVariableNames.ORIGINAL).type('{enter}');
      cy.refreshGraph();
      cy.assertLegendElement(`CPU time in user space`);

      //Label $label + constant
      cy.get(inputCustomLabelSelector).clear().type(`${LabelVariableNames.ORIGINAL} - LMP`).type('{enter}');
      cy.refreshGraph();
      cy.assertLegendElement(`CPU time in user space - LMP`);

      //Label $host_name + $label
      cy.get(inputCustomLabelSelector)
        .clear()
        .type(`${LabelVariableNames.ORIGINAL} - ${LabelVariableNames.HOSTNAME}`)
        .type('{enter}');
      cy.refreshGraph();
      cy.assertLegendElement(`CPU time in user space - ${hostName0}`);
    });
  });
  describe('CRE tests', () => {
    it('time-usage panel by service (single host)', {}, () => {
      cy.passOnException('ResizeObserver loop limit exceeded');
      cy.selectDataSource(CmkCRE);

      cy.filterBySite(Sites.ALL_SITES);
      cy.filterByHostname(hostName0);
      cy.filterByService(Services.CHECK_MK);

      cy.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

      cy.assertLegendElement('CPU time in user space');
      cy.assertLegendElement('CPU time in operating system');
      cy.assertLegendElement('Time spent waiting for Checkmk agent');
      cy.assertLegendElement('Total execution time');

      cy.assertHoverSelectorsOff(4);
      cy.assertHoverSelectorsOn(4);

      cy.contains("Could not find 'cmk_cpu_time_by_phase'").should('not.exist');

      cy.filterByService(Services.MEMORY_REGEX);

      cy.contains("Could not find 'cmk_cpu_time_by_phase'").should('be.visible'); // Assert previous graph input not visible
    });
    it('Used-RAM panel by service (single host)', {}, () => {
      cy.passOnException('ResizeObserver loop limit exceeded');
      cy.selectDataSource(CmkCRE);
      cy.filterBySite(Sites.ALL_SITES);
      cy.filterByHostname(hostName0);
      cy.filterByService(Services.MEMORY_REGEX);

      cy.selectPredefinedGraphType(GraphTypes.RAM_USED);

      cy.assertLegendElement('RAM used %'); // TODO: Getting 'RAM used %'. Should the graph name match the metric?

      cy.assertHoverSelectorsOff(1);
      cy.assertHoverSelectorsOn(1);
    });
  });
});
