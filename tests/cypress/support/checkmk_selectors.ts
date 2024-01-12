const Selectors = {
  SetupForm: {
    name: 'input[id="basic-settings-name"]',
    url: '[data-test-id="checkmk-url"]',
    edition: 'input[id="checkmk-edition"]',
    username: '[data-test-id="checkmk-username"]',
    password: '[data-test-id="checkmk-password"]',
    version: '[id="checkmk-version"]',
  },
  AddDashboard: {
    filterFieldId: 'input_add_filter',
    hostLabelFieldId: 'input_host_label',

    hostnameFilterFieldId: 'input_Hostname',
    serviceFilterFieldId: 'input_Service',
    hostnameRegexFilterFieldSelector: 'input[data-test-id="host_name_regex-filter-input"]',
    serviceRegexFilterFieldId: 'input[data-test-id="service_regex-filter-input"]',
    siteFilterFieldId: 'input_Site',

    predefinedGraphFieldId: 'input_Predefined_graph',

    removeFilterByServiceButtonSelector: '[data-test-id="cmk-oac-minus-button-Service"]',
  },
};

export default Selectors;
