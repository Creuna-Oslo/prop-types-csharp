/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import pt from 'prop-types';

import Link from './link';

const enumArray = ['value-1', 'value-2'];
const enumObject = {
  valueA: 'value-a',
  valueB: 'value-b'
};

const FunctionalComponent = props => <div>{props.text}</div>;

FunctionalComponent.propTypes = {
  text: pt.string.isRequired,
  isSomething: pt.bool,
  number: pt.number,
  intNumber: pt.number,
  floatNumber: pt.number.isRequired,
  texts: pt.arrayOf(pt.string),
  singleObject: pt.shape({
    propertyA: pt.string.isRequired
  }),
  objects: pt.arrayOf(
    pt.shape({
      propertyB: pt.string.isRequired
    })
  ).isRequired,
  shapeMeta: pt.shape({
    object: pt.object
  }),
  objectArray: pt.arrayOf(pt.object).isRequired,
  nestedList: pt.arrayOf(pt.arrayOf(pt.arrayOf(pt.string))),
  link: pt.shape(Link.propTypes),
  linkList: pt.arrayOf(pt.shape(Link.propTypes)),
  linkMeta: pt.object,
  linkListMeta: pt.array,
  enumArray: pt.oneOf(enumArray).isRequired,
  enumInline: pt.oneOf([1, 2]),
  enumObject: pt.oneOf(Object.keys(enumObject)),

  // These should be excluded
  instance: pt.instanceOf(Link),
  excludeMe: pt.number,
  node: pt.node,
  element: pt.element,
  function: pt.func
};

FunctionalComponent.propTypesMeta = {
  intNumber: 'int',
  floatNumber: 'float',
  excludeMe: 'exclude',
  shapeMeta: {
    object: Link
  },
  objectArray: Array(Link),
  linkMeta: Link,
  linkListMeta: Array(Link)
};

export default FunctionalComponent;
