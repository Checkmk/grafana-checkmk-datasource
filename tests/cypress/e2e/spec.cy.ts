import '../support/api_commands';
import '../support/commands';
import {
  inputFilterSelector,
  inputGraphTypeSelector,
  inputHostLabelsSelector,
  inputHostRegexSelector,
  inputHostSelector,
  inputMetricSelector,
  inputServiceRegexSelector,
  inputServiceSelector,
  inputTemplateSelector,
  panelContentSelector,
} from './helpers';

describe('e2e tests', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  const hostName0 = 'localhost_grafana0';
  const hostName1 = 'localhost_grafana1';

  before(function () {
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

  it('time-usage panel by service (single host)', {}, () => {
    cy.loginGrafana();
    cy.addNewPanel();

    cy.get(inputFilterSelector).type('Hostname{enter}'); // Filter -> 'Host name'
    cy.get(inputFilterSelector).type('Service{enter}'); // Filter -> 'Service'

    cy.get(inputHostSelector).type('{enter}'); // Hostname -> hostName0 (first entry)
    cy.contains(hostName0).should('exist');

    cy.get(inputServiceSelector).type('{enter}'); // Service -> 'Check_MK' (first entry)
    cy.contains('Check_MK').should('exist');

    cy.get(inputTemplateSelector).type('{enter}'); // Template -> 'Time usage by phase' (one entry)
    cy.contains('Time usage by phase').should('exist');

    cy.get(panelContentSelector).contains('CPU time in user space').should('be.visible');

    cy.saveDashboard();
  });

  it('time-usage panel by service (multiple hosts)', {}, () => {
    cy.loginGrafana();
    cy.addNewPanel();

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

    cy.saveDashboard();
  });

  it('RAM-used panel by service regex (multiple hosts)', {}, () => {
    cy.loginGrafana();
    cy.addNewPanel();

    cy.get(inputFilterSelector).type('Service regex{enter}'); // Filter -> 'Service'
    cy.contains('Service regex').should('exist');

    cy.get(inputServiceRegexSelector).type('Memory{enter}'); // Service regex -> 'Memory'
    cy.get('input[value="Memory"]').should('exist');

    cy.get(inputTemplateSelector).click(); // Template -> 'RAM used'
    cy.contains('RAM used').click();
    cy.contains('RAM used').should('exist');

    cy.get(panelContentSelector).contains(hostName0).should('be.visible');
    cy.get(panelContentSelector).contains(hostName1).should('be.visible');

    cy.saveDashboard();
  });

  it('RAM-used panel by host labels (multiple hosts, single metric)', {}, () => {
    cy.loginGrafana();
    cy.addNewPanel();

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

    cy.saveDashboard();
  });

  it('RAM-used panel by service regex and hostname regex', {}, () => {
    cy.loginGrafana();
    cy.addNewPanel();

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
    cy.rmCmkDatasource();

    cy.deleteCmkHost(hostName0);
    cy.deleteCmkHost(hostName1);

    cy.deleteCmkAutomationUser(true);
    cy.activateCmkChanges('cmk');
  });
});
