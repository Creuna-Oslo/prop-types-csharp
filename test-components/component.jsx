import React from 'react';
import pt from 'prop-types';

import Link from 'components/link';

const Component = props => <div>{props.text}</div>;

Component.propTypes = {
  text: pt.string.isRequired,
  isSomething: pt.bool,
  intNumber: pt.number,
  floatNumber: pt.number,
  texts: pt.arrayOf(pt.string),
  singleObject: pt.shape({
    propertyA: pt.string.isRequired
  }),
  objects: pt.arrayOf(
    pt.shape({
      propertyB: pt.string
    })
  ).isRequired,
  externalType: pt.shape(Link.propTypes),
  externalTypeList: pt.arrayOf(pt.shape(Link.propTypes)),

  // These should be excluded
  instance: pt.instanceOf(Link),
  excludeMe: pt.number,
  node: pt.node,
  element: pt.element,
  function: pt.func
};

Component.propTypesMeta = {
  intNumber: 'int',
  floatNumber: 'float',
  excludeMe: 'exclude'
};

export default Component;
