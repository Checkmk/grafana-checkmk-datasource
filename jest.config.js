/* eslint-env node */
// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  //testMatch: ['<rootDir>/test/unit/**/*.{spec,test,jest}.{js,jsx,ts,tsx}'],
  testMatch: ['**/tests/unit/**/*.{spec,test,jest}.{js,jsx,ts,tsx}'],
};
