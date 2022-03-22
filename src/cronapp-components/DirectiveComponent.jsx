import React from 'react';
import PropTypes from 'prop-types';
import {angularApp} from '../cronapp-components/AngularApp';
import {react2angular} from 'react2angular';
import {Button} from 'react-native';
import { getButtonProps } from '../react-native-components/Button';

const MyReactComponent = ({count}) => {

  return (
    <>
      <p>
        Eu sou um componente React <span>{count}</span>
      </p>
    </>
  );
};

const MyButton = (props) => {
  return <Button title={props.title} />;
};

MyReactComponent.propTypes = {
  count: PropTypes.number,
};

MyButton.propTypes = {
  title: PropTypes.string,
};

angularApp.component('myReactComponent', react2angular(MyReactComponent));

angularApp.component('myButton', react2angular(Button, getButtonProps()));

module.exports = {MyReactComponent};
