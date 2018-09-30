const t = require('@babel/types');

const getNameFromDeclaration = node => {
  const { declaration } = node;

  switch (node.declaration.type) {
    case 'Identifier':
      return { componentName: declaration.name };
    case 'ClassDeclaration':
      return { componentName: declaration.id.name };
    default:
      throw new Error(
        `Couldn't get component name because export is a ${declaration.type}.`
      );
  }
};

const multipleExportsError = new Error(
  `Couldn't get component name because of multiple exports.`
);

// Gets component name from export declaration. Expects a File node
module.exports = function({ syntaxTree }) {
  const exportDeclarations = syntaxTree.program.body.filter(statement =>
    t.isExportDeclaration(statement)
  );

  const exportDefaultDeclaration = exportDeclarations.find(declaration =>
    t.isExportDefaultDeclaration(declaration)
  );

  if (exportDefaultDeclaration) {
    return getNameFromDeclaration(exportDefaultDeclaration);
  }

  if (exportDeclarations.length > 1) {
    throw multipleExportsError;
  }

  const [declaration] = exportDeclarations;

  // An ExportDeclaration may have a 'declaration' property
  if (declaration.declaration) {
    return getNameFromDeclaration(declaration);
  }

  // It may also have a 'specifiers' property which holds a list of exports
  if (declaration.specifiers.length > 1) {
    throw multipleExportsError;
  }

  if (declaration.specifiers.length === 1) {
    const [specifier] = declaration.specifiers;
    return { componentName: specifier.exported.name };
  }

  throw new Error(
    `Component name not found. Make sure that:
• your component is exported as an ES module
• the file has at most one named export or a default export`
  );
};
