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
  },
};

export default Selectors;
