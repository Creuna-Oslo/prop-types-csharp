import React from 'react';
import PropTypes from 'prop-types';

import Link from 'components/link';

const Component = props => <div>{props.text}</div>;

Component.propTypes = {
  text: PropTypes.string.isRequired,
  isSomething: PropTypes.bool,
  intNumber: PropTypes.number,
  floatNumber: PropTypes.number,
  texts: PropTypes.arrayOf(PropTypes.string),
  singleObject: PropTypes.shape({
    propertyA: PropTypes.string.isRequired
  }),
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      propertyB: PropTypes.string
    })
  ).isRequired,
  externalType: Link.propTypes,
  externalTypeList: PropTypes.arrayOf(Link.propTypes),

  // These should be excluded
  instance: PropTypes.instanceOf(Link),
  excludeMe: PropTypes.number,
  node: PropTypes.node,
  element: PropTypes.element,
  function: PropTypes.func
};

Component.propTypesMeta = {
  intNumber: 'int',
  floatNumber: 'float',
  excludeMe: 'exclude'
};

export default Component;
