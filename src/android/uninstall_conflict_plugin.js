const path = require('path');
const fs = require('fs');
const CONFLICT_PLUGINS = [
  'cordova-plugin-androidx-adapter'
];
const TARGET_HOOKS = [
  'before_platform_add',
  'before_platform_ls',
  'before_prepare',
  'before_compile',
  'before_plugin_add',
  'before_plugin_ls',
  'before_plugin_install',
  'after_platform_add',
  'after_platform_ls',
  'after_prepare',
  'after_compile',
  'after_plugin_add',
  'after_plugin_ls',
  'after_plugin_install'
];

const DUMMY_SCRIPT_CODE = new Uint8Array(Buffer.from("/* This plugin is replaced by cordova-androidx-build */\nmodule.exports = function () {return Promise.resolve();};"));


module.exports = function (ctx) {
  var targetPlugins = {};
  CONFLICT_PLUGINS.forEach(function(pluginId) {
    targetPlugins[pluginId] = 1;
  });

  var PluginInfoProvider = require('cordova-common').PluginInfoProvider;
  var projectRoot = ctx.opts.projectRoot;
  var pluginsDir = path.join(projectRoot, 'plugins');
  var opts = {
    'projectRoot': projectRoot,
    'platforms': ['android']
  };

  // console.log(ctx.opts);

  return (new Promise(function (resolve) {
    var pluginInfoProvider = new PluginInfoProvider();
    var plugins = pluginInfoProvider.getAllWithinSearchPath(pluginsDir);
    plugins = plugins.filter(function(pluginInfo) {
      return (pluginInfo.id in targetPlugins);
    });
    resolve(plugins);
  }))
  .then(function(plugins) {
    return (new Promise(function(resolve) {
      var hookScripts = [];
      plugins.forEach(function(pluginInfo) {
        TARGET_HOOKS.forEach(function(hook) {
          var scripts = pluginInfo.getHookScripts(hook, ['android']);
          scripts = scripts.map(function(element) {
            return path.join(pluginsDir, pluginInfo.id, element.attrib.src);
          });
          hookScripts = hookScripts.concat(scripts);
        })
      });

      resolve(hookScripts);
    }));
  })
  .then(function(hookScripts) {

    hookScripts = hookScripts.filter(function(srcFilePath) {
      var backUpFilePath = srcFilePath + '.bak';
      try {
        fs.accessSync(backUpFilePath, fs.constants.R_OK);
        return false;
      } catch (err) {
        return true;
      }
    });

    var tasks = hookScripts.map(function(srcFilePath) {
      var backUpFilePath = srcFilePath + '.bak';

      return (new Promise(function(resolve) {
        fs.copyFile(srcFilePath, backUpFilePath, function() {
          console.log(backUpFilePath);
          resolve();
        });
      }))
      .then(function() {
        return (new Promise(function(resolve) {
          fs.writeFile(srcFilePath, DUMMY_SCRIPT_CODE, function(err) {
            resolve();
          });
        }));
      });
    });

    return Promise.all(tasks);
  });
};
