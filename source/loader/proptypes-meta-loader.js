const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');
const generator = require('@babel/generator').default;

module.exports = function (content, map, meta) {
  let config = {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module',
  };

  let parser = config => content => parse(content, config);

  try {
    let ast = (parser(config))(content);

    traverse(ast, {
      AssignmentExpression(path) {
        const left = path.get('left');
        if (t.isMemberExpression(left) && left.get('property').isIdentifier({ name: 'propTypesMeta' })) {
          path.remove();
          path.stop();
        }
      },
      ClassProperty(path) {
        const key = path.get('key');
        if (key.isIdentifier({ name: 'propTypesMeta' })) {
          path.remove();
          path.stop();
        }
      }
    });

    this.callback(null, generator(ast).code, map, meta);
    return; // always return undefined when calling callback()
  } catch (error) {
    this.emitError(error);
    return;
  }
};
