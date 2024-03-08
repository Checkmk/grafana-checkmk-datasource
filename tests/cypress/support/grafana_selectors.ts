const grafanaVersion = 10;

const addDataSourceSaveAndTestButtonV9 = 'button[aria-label="Data source settings page Save and Test button"]';
const addDataSourceSaveAndTestButtonV10 = `button[data-testid="data-testid Data source settings page Save and Test button"]`;

const addNewPanelButtonV9 = 'button[aria-label="Add new panel"]';
const addNewPanelButtonV10 = 'button[data-testid="data-testid Create new panel button"]';

const Selectors = {
  grafanaVersion,
  Login: {
    username_input: 'input[name="user"]',
    password_input: 'input[name="password"]',
    login_button: 'button[data-testid="data-testid Login button"]',
  },

  AddDataSource: {
    select_datasource_button: (name: string): string => `button[aria-label="${`Add new data source ${name}`}"]`,
    save_and_test_button: grafanaVersion >= 10 ? addDataSourceSaveAndTestButtonV10 : addDataSourceSaveAndTestButtonV9,
  },

  AddDashboard: {
    add_new_panel_button: grafanaVersion >= 10 ? addNewPanelButtonV10 : addNewPanelButtonV9,
    datasources_list: 'div[data-testid="data-testid Data source list dropdown"]',
  },
};

export default Selectors;
