const fs = require('fs');
const path = require('path');

const transformPropTypes = require('./source/transforms/transform-prop-types');

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign(
    {
      exclude: ['node_modules'],
      path: '',
      requirePropTypes: true
    },
    options
  );
}

PropTypesCSharpPlugin.prototype.apply = function(compiler) {
  const outputPath = path.normalize(this.options.path);

  const buildModule = (compilation, module) => {
    const filePath = module.resource;
    const shouldExclude =
      filePath &&
      this.options.exclude.some(excludeStringOrRegExp =>
        filePath.match(excludeStringOrRegExp)
      );

    if (!filePath || !filePath.match(/\.jsx$/) || shouldExclude) {
      return;
    }

    try {
      const sourceCode = fs.readFileSync(module.resource, 'utf-8');
      const { code, componentName } = transformPropTypes({
        requirePropTypes: this.options.requirePropTypes,
        sourceCode
      });

      if (code && componentName) {
        compilation.assets[path.join(outputPath, `${componentName}.cs`)] = {
          source: () => code,
          size: () => code.length
        };
      }
    } catch (error) {
      compilation.errors.push(
        new Error(`C# class generator plugin\n${filePath}\n${error}\n`)
      );
    }
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
