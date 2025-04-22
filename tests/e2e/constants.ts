export const HOSTNAME0 = 'localhost_grafana0';
export const HOSTNAME1 = 'localhost_grafana1';

export const TESTDATASOURCENAME0 = 'cmk_test_datasource_0';
export const TESTDATASOURCENAME1 = 'cmk_test_datasource_1';

export enum CmkEdition {
  CRE = 'Raw Edition',
  CEE = 'Commercial editions',
}

export const GRAFANA_SELECTORS = {
  SPINNER: 'div[data-testid="Spinner"]',

  LOGIN: {
    USERNAME_FIELD: 'input[name="user"]',
    PASSWORD_FIELD: 'input[name="password"]',
    LOGIN_BUTTON: 'button[data-testid="data-testid Login button"]',
  },

  DATASOURCE: {
    //SELECT_DATASOURCE_BUTTON: (name: string): string => `button[aria-label="${`Add new data source ${name}`}"]`,
    CHECKMK_DATASOURCE_BUTTON: 'button[aria-label="Add new data source Checkmk"]',
    TYPE_FIELD: 'select[name="type"]',
    URL_FIELD: 'input[name="url"]',
    ACCESS_FIELD: 'select[name="access"]',
    BASIC_AUTH_FIELD: 'input[name="basicAuthUser"]',
    BASIC_AUTH_PASSWORD_FIELD: 'input[name="basicAuthPassword"]',
    JSON_DATA_FIELD: 'textarea[name="jsonData"]',
    SAVE_AND_TEST_BUTTON: 'button[data-testid="data-testid Data source settings page Save and Test button"]',
    SUCCESS: '[data-testid="data-testid Alert success"]',
  },

  DASHBOARD: {
    ADD_NEW_DASHBOARD_BUTTON: 'button[data-testid="data-testid Create new panel button"]',
    DATASOURCES_LIST: 'div[data-testid="data-testid Data source list dropdown"]',
    DATASOURCE_INPUT: 'data-testid="data-testid Select a data source"',

    FILTER_FIELD: '#input_add_filter',
    HOST_LABEL_FILTER_FIELD_ID: 'input_host_label',
    REMOVE_FILTER: (f: string) => `button[data-test-id="cmk-oac-minus-button-${f}"]`,

    AGGREGATION_FIELD_ID: 'input_Aggregation',
    HOST_NAME_FILTER_FIELD_ID: 'input_Hostname',
    SERVICE_FILTER_FIELD_ID: 'input_Service',
    HOSTNAME_REGEX_FILTER_FIELD: 'input[data-test-id="host_name_regex-filter-input"]',
    SERVICE_REGEX_FILTER_FIELD: 'input[data-test-id="service_regex-filter-input"]',
    SITE_FILTER_FIELD_ID: 'input_Site',

    GRAPH_TYPE_ID: 'input_Graph_type',
    PREDEFINED_GRAPH_FIELD_ID: 'input_Predefined_graph',
    SINGLE_METRIC_GRAPH_FIELD_ID: 'input_Single_metric',
    PANEL_CONTENT_SELECTOR: '[class$="panel-content"]',
    PANEL_HOVER: '[class="u-over"]',
    PLOTTED_HOVER_OFF: '[class="u-cursor-pt u-off"]',
    PLOTTED_HOVER_ON: '[class="u-cursor-pt"]',

    REMOVE_FILTER_BY_SERVICE_BUTTON: '[data-test-id="cmk-oac-minus-button-Service"]',

    CUSTOM_LABEL_FIELD: 'input[data-test-id="custom-label-field"]',

    REFRESH_GRAPH_BUTTON: 'button[data-testid="data-testid RefreshPicker run button"]',

    APPLY_CHANGES_AND_SAVE_BUTTON: 'button[data-testid="data-testid Save dashboard button"]',
    SAVE_DASHBOARD_TITLE: 'input[aria-label="Save dashboard title field"]',
    SAVE_BUTTON: 'button[data-testid="data-testid Save dashboard drawer button"]',

    SETTINGS_BUTTON: 'button[data-testid="data-testid Dashboard settings"]',
    VARIABLES_TAB: 'a[data-testid="data-testid Tab Variables"]',
    ADD_VARIABLE_BUTTON: 'button[data-testid="data-testid Call to action button Add variable"]',
    VARIABLE_NAME_INPUT: 'input[data-testid="data-testid Variable editor Form Name field"]',
    BACK_TO_DASHBOARD_BUTTON: 'button[data-testid="data-testid Back to dashboard button"]',
    ADD_VISUALIZATION_BUTTON: 'button[data-testid="data-testid Create new panel button"]',
  },
};

export const CMK_SELECTORS = {
  SETUP_FORM: {
    NAME: 'input[id="basic-settings-name"]',
    URL: '[data-test-id="checkmk-url"]',
    EDITION: 'input[id="checkmk-edition"]',
    USERNAME: '[data-test-id="checkmk-username"]',
    PASSWORD: '[data-test-id="checkmk-password"]',
  },
};

export const GRAFANA_TEXT = {
  DATASOURCE_IS_WORKING: 'Data source is working',
  EDITION_MISMATCH: 'Choose commercial editions in the data source settings to enable all features',
  DASHBOARD_SAVED: 'Dashboard saved',
};

export enum FilterTypes {
  HOSTNAME = 'Hostname',
  HOSTNAME_REGEX = 'Hostname regex',
  HOST_LABELS = 'Host labels',
  SERVICE = 'Service',
  SERVICE_REGEX = 'Service regex',
}

export enum Services {
  CHECK_MK = 'Check_MK',
  CPU_REGEX = 'CPU',
  MEMORY_REGEX = 'Memory',
}

export enum GraphTypes {
  TIME_BY_PHASE = 'Time usage by phase',
  RAM_USAGE = 'RAM usage',
  UPTIME = 'Uptime',

  PREDEFINED = 'Predefined graph',
  SINGLE_METRIC = 'Single metric',
}

export enum Sites {
  ALL_SITES = 'All Sites',
}

export enum GraphLegends {
  CPU_TIME_IN_USER_SPACE = 'CPU time in user space',
  CPU_TIME_IN_OS = 'CPU time in operating system',
  TIME_SPENT_WAITING_FOR_CHECKMK = 'Time spent waiting for Checkmk agent',
  TOTAL_EXECUTION_TIME = 'Total execution time',
  RAM_USAGE = 'Ram usage',
}

export enum CustomLabels {
  ORIGINAL = '$label',
  SITE = '$filter_site',
  HOSTNAME = '$filter_host_name',
  HOST_IN_GROUP = '$filter_host_in_group',
  SERVICE = '$filter_service',
  SERVICE_IN_GROUP = '$filter_service_in_group',
}
