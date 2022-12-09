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
    headers: { accept: 'application/json' },
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

export function deleteCmkHost(hostName: string) {
  cy.request({
    method: 'DELETE',
    url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/objects/host_config/' + hostName,
    headers: { accept: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
  });
}

export function activateCmkChanges(siteName: string) {
  cy.request({
    method: 'POST',
    url:
      Cypress.env('cypressToCheckmkUrl') +
      '/check_mk/api/1.0/domain-types/activation_run/actions/activate-changes/invoke',
    followRedirect: true,
    headers: { content: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
    body: {
      redirect: false,
      sites: [siteName],
      force_foreign_changes: false,
    },
  }).then((response) => {
    expect(response.status).is.equal(200);
  });
}
