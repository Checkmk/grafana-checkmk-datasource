export {};

const cmkAutomationUser = 'cmkuser';
const cmkAutomationPassword = 'somepassword123457';

Cypress.Commands.add('createCmkAutomationUser', () => {
  cy.request({
    method: 'POST',
    url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/domain-types/user_config/collections/all',
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
    body: {
      username: cmkAutomationUser,
      fullname: cmkAutomationUser,
      roles: ['admin'],
      auth_option: {
        auth_type: 'automation',
        secret: cmkAutomationPassword,
      },
    },
  });
});

Cypress.Commands.add('deleteCmkAutomationUser', (failOnStatusCode: boolean) => {
  cy.request({
    method: 'DELETE',
    url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/objects/user_config/' + cmkAutomationUser,
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
    failOnStatusCode: failOnStatusCode,
  });
});

Cypress.Commands.add('createCmkHost', (hostName: string) => {
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
});

Cypress.Commands.add('deleteCmkHost', (hostName: string) => {
  cy.request({
    method: 'DELETE',
    url: Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/objects/host_config/' + hostName,
    headers: { accept: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
  });
});

Cypress.Commands.add('waitForActivation', (activationID: string, waitingTime: number) => {
  cy.wait(waitingTime);
  cy.request({
    method: 'GET',
    url:
      Cypress.env('cypressToCheckmkUrl') +
      '/check_mk/api/1.0/objects/activation_run/' +
      activationID +
      '/actions/wait-for-completion/invoke',
    followRedirect: false,
    headers: { accept: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
  }).then((response) => {
    if (response.status === 204) return;

    cy.waitForActivation(activationID, 1000);
  });
});

Cypress.Commands.add('activateCmkChanges', (siteName: string) => {
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

    cy.waitForActivation(activation_id, 1000);
  });
});

Cypress.Commands.add('executeServiceDiscovery', (hostName: string, mode: string) => {
  cy.request({
    method: 'POST',
    url:
      Cypress.env('cypressToCheckmkUrl') + '/check_mk/api/1.0/domain-types/service_discovery_run/actions/start/invoke',
    followRedirect: true,
    headers: { accept: 'application/json' },
    auth: {
      bearer: `${Cypress.env('cmkUsername')} ${Cypress.env('cmkPassword')}`,
    },
    body: {
      host_name: hostName,
      mode: mode,
    },
  }).then((response) => {
    expect(response.status).is.equal(200);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      createCmkAutomationUser(): Chainable<void>;
      deleteCmkAutomationUser(failOnStatusCode: boolean): Chainable<void>;
      createCmkHost(hostName: string): Chainable<void>;
      deleteCmkHost(hostName: string): Chainable<void>;
      waitForActivation(activationID: string, waitingTime: number): Chainable<void>;
      activateCmkChanges(siteName: string): Chainable<void>;
      executeServiceDiscovery(hotname: string, mode: string): Chainable<void>;
    }
  }
}
