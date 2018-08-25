const { parse } = require('@babel/parser');
const test = require('ava');

const getPropTypesIdentifierName = require('../../lib/utils/get-prop-types-identifier-name');

test('With PropTypes import', t => {
  const syntaxTree = parse('import pt from "prop-types";', {
    sourceType: 'module'
  });
  t.is(
    getPropTypesIdentifierName({ syntaxTree }).propTypesIdentifierName,
    'pt'
  );
});

test('Without PropTypes import', t => {
  const syntaxTree = parse('import React from "react";', {
    sourceType: 'module'
  });
  t.is(
    getPropTypesIdentifierName({ syntaxTree }).propTypesIdentifierName,
    undefined
  );
});
