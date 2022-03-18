import React from 'react';
import PropTypes from 'prop-types';
import {angularApp} from '../cronapp-components/AngularApp';
import {react2angular} from 'react2angular';

const MyReactComponent = ({count}) => {
  return (
    <>
      <p>
        Eu sou um componente React <span>{count}</span>
      </p>
      {/* <Tarso /> */}
    </>
  );
};

const Tarso = (props) => {
  return <>oi Tarso, seje omilde!</>;
};

MyReactComponent.propTypes = {
  count: PropTypes.number,
};

angularApp.component('myReactComponent', react2angular(MyReactComponent));

module.exports = {MyReactComponent};
