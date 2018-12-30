const matchNode = require('../../utils/match-node');

module.exports = idNode =>
  matchNode(idNode, {
    Identifier: n => n.name,
    TSQualifiedName: n => `${n.left.name}.${n.right.name}`
  });
