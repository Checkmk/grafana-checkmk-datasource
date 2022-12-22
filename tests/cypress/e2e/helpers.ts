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

function waitForActivation(activation_id: string, waitingTime: number = 1000) {
  cy.wait(waitingTime);
  cy.request({
    method: 'GET',
    url:
      Cypress.env('cypressToCheckmkUrl') +
      '/check_mk/api/1.0/objects/activation_run/' +
      activation_id +
      '/actions/wait-for-completion/invoke',
    followRedirect: false,
    headers: { accept: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
  }).then((response) => {
    if (response.status === 204) return;

    waitForActivation(activation_id);
  });
}

export function activateCmkChanges(siteName: string) {
  cy.on('uncaught:exception', (err, runnable) => {
    // activating changes is raising an uncaught exception
    // with no error message.
    // We are here avoiding to listen to uncaught exceptions
    // with no error messages.
    // TODO: investigate the root cause of such exception and
    // remove this.

    if (err.message.match('')) {
      return false;
    }
  });

  cy.request({
    method: 'POST',
    url:
      Cypress.env('cypressToCheckmkUrl') +
      '/check_mk/api/1.0/domain-types/activation_run/actions/activate-changes/invoke',
    followRedirect: false,
    headers: { accept: 'application/json' },
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

    const activation_id = response.body.id;
    cy.log('Activation ID: ' + activation_id);

    waitForActivation(activation_id);
  });
}

export function recursiveType(
  targetSelector: string,
  checkSelector: string,
  bodySelector: string,
  typedCommand: string,
  count: number,
  forceType: boolean
) {
  assert(count >= 0);

  cy.log('Recursive typing ' + typedCommand + ' in ' + targetSelector + ' (' + count + ' tries left)');
  cy.get(targetSelector).type(typedCommand, { force: forceType });

  cy.get(bodySelector).then(($body) => {
    const checkCondition = $body.find(checkSelector).is(':visible');
    if (count == 0 || checkCondition) {
      assert(checkCondition);
      return;
    }

    recursiveType(targetSelector, checkSelector, bodySelector, typedCommand, count - 1, forceType);
  });
}
