// This file extends the root babel.config.js
module.exports = function(api) {
  api.cache(true);
  
  // Get the root config
  const rootConfig = require('../../babel.config')(api);
  
  // Remove the module-resolver alias that referenced the shared directory
  const moduleResolverPlugin = rootConfig.plugins.find(
    plugin => Array.isArray(plugin) && plugin[0] === 'module-resolver'
  );
  
  if (moduleResolverPlugin) {
    // Clear aliases as we no longer need them
    moduleResolverPlugin[1].alias = {};
  }
  
  return rootConfig;
}; 