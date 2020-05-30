module.exports = function (ctx) {

  var PluginInfoProvider = require('cordova-common').PluginInfoProvider;

  var path = require('path');

  var projectRoot = ctx.opts.projectRoot;
  return (new Promise(function (resolve, reject) {

    var pluginsDir = path.join(projectRoot, 'plugins');
    var pluginInfoProvider = new PluginInfoProvider();
    var plugins = pluginInfoProvider.getAllWithinSearchPath(pluginsDir);
    var pluginInfo;
    var needToUninstall = false;
    for (var i = 0; i < plugins.length; i++) {
      pluginInfo = plugins[i];
      if (pluginInfo.id === 'cordova-plugin-androidx-adapter') {
        needToUninstall = true;
        break;
      }
    }

    if (needToUninstall) {
      console.info('--[cordova-androidx-build]------------------------');
      console.info('Since cordova-plugin-androidx-adapter breaks cordova-androidx-build code,');
      console.info('uninstall cordova-plugin-androidx-adapter automatically.');
      console.info('-----------------------------------------------------');

      var exec = require('child_process').exec;
      exec('cordova plugin rm cordova-plugin-androidx-adapter 2>&1', function (err, stdout) {
        if (err) {
          reject(err);
        } else {
          console.log(stdout);
          exec('npm uninstall cordova-plugin-androidx-adapter --save 2>&1', function () {
            resolve();
          });
        }
      });
    } else {
      resolve();
    }
  }));

};
