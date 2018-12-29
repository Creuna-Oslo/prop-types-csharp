const getNodeOfType = require('../../utils/get-node-of-type');

module.exports = idNode =>
  getNodeOfType(idNode, {
    Identifier: n => n.name,
    TSQualifiedName: n => `${n.left.name}.${n.right.name}`
  });
