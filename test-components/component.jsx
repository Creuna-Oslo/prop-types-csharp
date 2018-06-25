import React from 'react';
import PropTypes from 'prop-types';

import Link from 'components/link';

const Component = props => <div>{props.text}</div>;

Component.propTypes = {
  list: PropTypes.arrayOf(PropTypes.string),
  text: PropTypes.string,
  isSomething: PropTypes.bool,
  singleObject: PropTypes.shape({
    propertyA: PropTypes.string
  }),
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      propertyB: PropTypes.string
    })
  ),
  externalType: Link.propTypes,
  externalTypeList: PropTypes.arrayOf(Link.propTypes)
};

export default Component;
