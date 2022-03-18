import angular from 'angular';
import React, {Component, useEffect, useState} from 'react';
import reactDom, {createPortal} from 'react-dom';
import './cronapp-components/DirectiveComponent';

const Button = ()=>{
  return <></>
}

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
  Button
};
