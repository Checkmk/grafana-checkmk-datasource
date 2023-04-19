import { E2ESelectors } from '@grafana/e2e-selectors';

export const Components = {
  QueryEditor: {
    Filters: {
      addFilter: 'data-testid addFilter',
      hostname: 'data-testid hostname filter',
      service: 'data-testid service filter',
    },
    Selects: {
      graph: 'data-testid graph select',
    },
  },
  ConfigEditor: {
    backedUrl: 'data-testid checkmk-url',
    edition: 'checkmk-edition',
    backend: 'checkmk-version',
    username: 'data-testid checkmk-username',
    secret: 'data-testid checkmk-password',
  },
};

export const selectors: E2ESelectors<{ components: typeof Components }> = {
  components: Components,
};
