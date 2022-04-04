import angular from 'angular';
import React, {Component, useEffect, useState} from 'react';
import reactDom, {createPortal} from 'react-dom';
import { Button, Modal, View } from 'react-native';
import {loadReactNativeComponents} from './cronapp-components/ReactNativeComponents';
import second from './cronapp-components/ReactCodeElement'

loadReactNativeComponents();

const App = () => {
  return (
    <>
      {createPortal(
        <div
          className="fill"
          dangerouslySetInnerHTML={{__html: '<div ui-view class="fill"></div>'}}
        />,
        document.getElementById('react-app'),
      )}
    </>
  );
};

module.exports = {
  App,
};