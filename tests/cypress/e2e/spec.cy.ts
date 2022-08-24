describe('Source configuration', () => {
  const cmkUser = 'cmkuser';
  const cmkPassword = 'somepassword123457';

  function createCmkAutomationUser() {
    cy.request({
      method: 'DELETE',
      url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/objects/user_config/' + cmkUser,
      auth: {
        bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
      },
      failOnStatusCode: false,
    });
    cy.request({
      method: 'POST',
      url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/domain-types/user_config/collections/all',
      auth: {
        bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
      },
      body: {
        username: cmkUser,
        fullname: cmkUser,
        roles: ['admin'],
        auth_option: {
          auth_type: 'automation',
          secret: cmkPassword,
        },
      },
    });
  }

  it('configures the datasource correctly', () => {
    createCmkAutomationUser();

    cy.visit('/');
    cy.get('input[name="user"]').type(Cypress.env('grafanaUsername'));
    cy.get('input[name="password"]').type(Cypress.env('grafanaPassword'));
    cy.get('[aria-label="Login button"]').click();

    cy.visit('/datasources/new');
    cy.get('button[aria-label="Add data source Checkmk"]').contains('Checkmk').click();

    cy.get('[data-test-id="checkmk-url"]').type(Cypress.env('grafanaToCheckmkUrl'));
    cy.get('[data-test-id="checkmk-username"]').type(cmkUser);
    cy.get('[data-test-id="checkmk-password"]').type(cmkPassword);

    cy.get('[aria-label="Data source settings page Save and Test button"]').click();

    cy.get('[data-testid="data-testid Alert success"]').should('be.visible');
  });
});
