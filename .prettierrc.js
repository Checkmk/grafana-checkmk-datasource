module.exports = {
  ...require('./node_modules/@grafana/toolkit/src/config/prettier.plugin.config.json'),
};
module.exports.importOrder = ['^components/(.*)$', '^[./]'];
module.exports.importOrderSeparation = true;
module.exports.importOrderSortSpecifiers = true;
