import { EnvironmentPlugin, ProvidePlugin } from 'webpack';

import defaultConfig from './.config/webpack/webpack.config';

const config = async (env: Record<string, string>) => {
  const appliedConfig = await defaultConfig(env);
  appliedConfig.plugins.push(new EnvironmentPlugin({ BUILD_EDITION: process.env.EDITION ?? 'NON_CLOUD' }));
  appliedConfig.plugins.push(new ProvidePlugin({ process: 'process/browser' }));
  return appliedConfig;
};

export default config;
