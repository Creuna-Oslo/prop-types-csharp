const fs = require('fs');
const path = require('path');

const transformPropTypes = require('./source/transforms/transform-prop-types');

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign(
    {
      path: ''
    },
    options
  );
}

PropTypesCSharpPlugin.prototype.apply = function(compiler) {
  const outputPath = path.normalize(this.options.path);

  const buildModule = (compilation, module) => {
    const filePath = module.resource;

    if (
      !filePath ||
      filePath.includes('node_modules') ||
      !filePath.match(/\.jsx$/)
    ) {
      return;
    }

    const fileContent = fs.readFileSync(module.resource, 'utf-8');
    const { code, componentName } = transformPropTypes(
      fileContent,
      module.resource
    );

    compilation.assets[path.join(outputPath, `${componentName}.cs`)] = {
      source: () => code,
      size: () => code.length
    };
  };

  const plugin = { name: 'PropTypesCSharpPlugin' };

  const compilation = compilation => {
    if (compilation.hooks) {
      compilation.hooks.buildModule.tap(
        plugin,
        buildModule.bind(this, compilation)
      );
    } else {
      compiler.plugin('buildModule', buildModule.bind(this, compilation));
    }
  };

  if (compiler.hooks) {
    compiler.hooks.compilation.tap(plugin, compilation);
  } else {
    compiler.plugin('compilation', compilation);
  }
};

PropTypesCSharpPlugin['default'] = PropTypesCSharpPlugin;
module.exports = PropTypesCSharpPlugin;
