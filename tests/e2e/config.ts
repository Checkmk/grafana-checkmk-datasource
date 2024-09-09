import dotenv from 'dotenv';

dotenv.config();

const site = process.env.CMK_SITE;

const cfg = {
  //Checkmk
  site: site,
  cmkUser: process.env.CMK_ADMIN,
  cmkPassword: process.env.CMK_PASSWORD,
  automationUser: process.env.CMK_AUTOMATION,
  automationPassword: process.env.CMK_PASSWORD,

  // Playwright
  playwrightToCheckmkUrl: process.env.PLAYWRIGHT_TO_CHECKMK_URL,
  grafanaUrl: process.env.PLAYWRIGHT_TO_GRAFANA_URL,

  // Grafana
  grafanaUser: process.env.GRAFANA_USER,
  grafanaPassword: process.env.GRAFANA_PASSWORD,

  grafanaToCheckMkUser: process.env.GRAFANA_TO_CHECKMK_USER,
  grafanaToCheckMkPassword: process.env.GRAFANA_TO_CHECKMK_PASSWORD,
  grafanaToCheckMkUrl: process.env.GRAFANA_TO_CHECKMK_URL,
};

export default cfg;
