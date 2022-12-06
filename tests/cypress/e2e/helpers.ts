export function createCmkAutomationUser(cmkUser: string, cmkPassword: string) {
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

export function createCmkHost(hostName: string) {
  cy.request({
    method: 'POST',
    url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/domain-types/host_config/collections/all',
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
    qs: { bake_agent: false },
    body: {
      folder: '/',
      host_name: hostName,
      attributes: {
        ipaddress: '127.0.0.1',
      },
    },
  });
}
