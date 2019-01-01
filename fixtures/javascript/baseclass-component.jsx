import React from 'react';
import PropTypes from 'prop-types';

const BaseClassComponent = ({ prop }) => <div className="">{prop}</div>;

BaseClassComponent.propTypes = {
  prop: PropTypes.string
};

export default BaseClassComponent;
