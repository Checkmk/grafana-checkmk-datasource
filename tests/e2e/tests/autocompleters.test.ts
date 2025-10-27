// @ts-check
import { expect, test } from '@grafana/plugin-e2e';

import config from '../config';
import { FilterTypes, Graphs, HOSTNAME0, Services } from '../constants';
import { CmkRawQueryEditorPage } from '../pom/CMKRawQueryEditorPage.ts';
import { CmkCEEQueryEditorPage } from '../pom/CmkCEEQueryEditorPage';

const SITE = 'All sites';

test.describe('Comercial editions tests', () => {
  test.slow();
  test('Filtering autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    const filters = [
      FilterTypes.HOSTNAME,
      FilterTypes.HOST_IN_GROUP,
      FilterTypes.HOST_LABELS,
      FilterTypes.SERVICE,
      FilterTypes.SERVICE_IN_GROUP,
    ];

    for (const flt of filters) {
      const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
      await panelPage.addFilter(flt);
      const response = await responsePromise;
      expect(response.ok(), `${flt} autocompleter`).toBeTruthy();
    }

    const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.addFilter(FilterTypes.HOST_TAGS, 'cmk-oac-minus-button-Host tags');
    const response = await responsePromise;
    expect(response.ok(), `${FilterTypes.HOST_TAGS} autocompleter`).toBeTruthy();
  });

  test('Predefined graph autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.selectPredefinedGraph(Graphs.TIME_BY_PHASE);
    const response = await responsePromise;
    expect(response.ok(), 'Predefined graph autocompleter').toBeTruthy();
  });

  test('Single metric autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    await panelPage.selectSingleMetricGraphType();
    const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.selectSingleMetricGraph(Graphs.CPU_TIME_IN_USER_SPACE);
    const response = await responsePromise;
    expect(response.ok(), 'Single metric autocompleter').toBeTruthy();
  });
});

test.describe('Raw edition tests', () => {
  test.slow();
  test('Filtering autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkRawQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    let responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.filterBySite(SITE);
    let response = await responsePromise;
    expect(response.ok(), 'Service autocompleter').toBeTruthy();

    responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.filterByHostname(HOSTNAME0);
    response = await responsePromise;
    expect(response.ok(), 'Host name autocompleter').toBeTruthy();

    responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.filterByService(Services.CHECK_MK);
    response = await responsePromise;
    expect(response.ok(), 'Service autocompleter').toBeTruthy();
  });

  test('Predefined graph autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkRawQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterBySite(SITE);
    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.selectPredefinedGraph(Graphs.TIME_BY_PHASE);
    const response = await responsePromise;
    expect(response.ok(), 'Predefined graph autocompleter').toBeTruthy();
  });

  test('Single metric autocompleters', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkRawQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterBySite(SITE);
    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    await panelPage.selectSingleMetricGraphType();
    const responsePromise = page.waitForResponse('**/objects/autocomplete/**');
    await panelPage.selectSingleMetricGraph(Graphs.CPU_TIME_IN_USER_SPACE);
    const response = await responsePromise;
    expect(response.ok(), 'Single metric autocompleter').toBeTruthy();
  });
});
