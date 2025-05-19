import { APIRequestContext, expect, request } from '@playwright/test';

import config from '../config';
import { wait } from './util';

let requestContext: APIRequestContext;

let counter = 0;
const animation = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const getAnimation = () => animation[counter++ % animation.length];

(async () => {
  requestContext = await request.newContext({
    baseURL: config.playwrightToCheckmkUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${config.cmkUser} ${config.cmkPassword}`,
    },
  });
})();

const deleteCmkAutomationUser = async (failOnError = true) => {
  console.log(`💀 Deleting automation user ${config.automationUser}`);
  const url = `check_mk/api/1.0/objects/user_config/${config.automationUser}`;

  await requestContext.delete(url, { failOnStatusCode: failOnError });
};

const createCmkAutomationUser = async () => {
  console.log(`😀 Creating automation user ${config.automationUser}`);
  await requestContext.post('check_mk/api/1.0/domain-types/user_config/collections/all', {
    data: {
      username: config.automationUser,
      fullname: config.automationUser,
      roles: ['admin'],
      auth_option: {
        auth_type: 'automation',
        secret: config.automationPassword,
      },
    },
    failOnStatusCode: true,
  });
};

const createHost = async (hostName: string) => {
  console.log(`🖥️ Creating host ${hostName}`);
  await requestContext.post('check_mk/api/1.0/domain-types/host_config/collections/all', {
    headers: { accept: 'application/json' },
    params: { bake_agent: false },
    data: {
      folder: '/',
      host_name: hostName,
      attributes: {
        ipaddress: '127.0.0.1',
      },
    },
    failOnStatusCode: true,
  });
};

const deleteHost = async (hostName: string, failOnError = true) => {
  console.log(`🖥️ Deleting host ${hostName}`);
  const url = `check_mk/api/1.0/objects/host_config/${hostName}`;
  await requestContext.delete(url, { failOnStatusCode: failOnError });
};

const waitForActivation = async (activationID: string, waitingTime: number) => {
  console.log(`⌛ Waiting for activation ${activationID} (waiting time: ${waitingTime}ms)`);
  await wait(waitingTime);

  const response = await requestContext.get(
    `check_mk/api/1.0/objects/activation_run/${activationID}/actions/wait-for-completion/invoke`,
    {
      headers: { accept: 'application/json' },
      maxRedirects: 0,
    }
  );

  if (response.status() === 204) {
    return;
  } else {
    await waitForActivation(activationID, waitingTime);
  }
};

const activateChanges = async (sitename: string) => {
  console.log(`📝 Activating changes on site ${sitename}`);
  const response = await requestContext.post(
    'check_mk/api/1.0/domain-types/activation_run/actions/activate-changes/invoke',
    {
      headers: { accept: 'application/json', 'If-Match': '*' },
      data: {
        redirect: false,
        sites: [sitename],
        force_foreign_changes: true,
      },
      maxRedirects: 0,
      failOnStatusCode: false,
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('id');

  const activation_id = body.id;

  await waitForActivation(activation_id, 1000);
};

const executeServiceDiscovery = async (hostName: string, mode: string) => {
  console.log(`🔍 Executing service discovery on host ${hostName} (mode: ${mode})`);

  const response = await requestContext.post(
    'check_mk/api/1.0/domain-types/service_discovery_run/actions/start/invoke',
    {
      headers: { accept: 'application/json' },
      data: {
        host_name: hostName,
        mode: mode,
      },
      maxRedirects: 999,
    }
  );

  expect(response.ok()).toBeTruthy();
  waitForDiscovery(hostName);
};

const waitForDiscovery = async (hostName: string) => {
  console.log(`⌛ Waiting for service discovery on host ${hostName}`);
  await wait(1000);

  const response = await requestContext.get(`check_mk/api/1.0/objects/service_discovery_run/${hostName}`, {
    headers: { accept: 'application/json' },
    maxRedirects: 0,
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  console.log(`🔍 Service discovery on host ${hostName}: ${body.extensions.state}`);

  if (body.extensions.state !== 'finished') {
    console.log(` --- ${JSON.stringify(body.extensions.logs, undefined, 4)}`);
    await waitForDiscovery(hostName);
  }
};

const waitForPendingServices = async (waitingTime: number) => {
  console.log('⌛ Waiting for pending services');
  await wait(waitingTime);

  const response = await requestContext.get('check_mk/api/1.0/domain-types/host/collections/all', {
    headers: { accept: 'application/json' },
    params: { columns: 'num_services_pending' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  let totalPending = 0;

  for (const host of body.value) {
    totalPending += host.extensions.num_services_pending;
  }

  if (totalPending > 0) {
    console.log(`⌛ Waiting for ${totalPending} pending services ${getAnimation()}`);
    await waitForPendingServices(waitingTime);
  }
};

const waitUntilCheckmkIsReady = async () => {
  console.log(`⌛ Waiting for Checkmk to be ready ${getAnimation()}`);

  let ready = false;

  try {
    const response = await requestContext.get('check_mk/api/1.0/version', {
      headers: { accept: 'application/json' },
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    ready = response.ok();
  } catch (error) {}

  if (ready) {
    console.log('🎉 Checkmk is ready');
    return;
  }

  await wait(5000);
  await waitUntilCheckmkIsReady();
};

const waitUntilAutomationIsReady = async () => {
  console.log(`⌛ Waiting for automation user to be ready ${getAnimation()}`);

  let ready = false;

  try {
    const response = await requestContext.get('check_mk/api/1.0/version', {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${config.automationUser} ${config.automationPassword}`,
      },
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    ready = response.ok();
  } catch (error) {}

  if (ready) {
    console.log('🎉 Automation user is ready');
    return;
  }

  await wait(5000);
  await waitUntilAutomationIsReady();
};

export default {
  deleteCmkAutomationUser,
  createCmkAutomationUser,
  createHost,
  deleteHost,
  activateChanges,
  waitForActivation,

  executeServiceDiscovery,
  waitForDiscovery,
  waitForPendingServices,

  waitUntilAutomationIsReady,
  waitUntilCheckmkIsReady,
};
