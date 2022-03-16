import React, {Component, useEffect, useState} from 'react';
import reactDom from 'react-dom';
import {SafeAreaView, ScrollView} from 'react-native';
import styles from './App.css';
// import DirectiveComponent from './cronapp-components/DirectiveComponent';
import {angular2react} from 'angular2react';
import InnerHTML from 'dangerously-set-html-content';
// import angularApp from './cronapp-components/app';
// import './cronapp-components/directives';
import myimg from './images/avatar.png';
import {Button} from 'react-native';
import {getPage} from './utils/route.utils';
import $ from 'jquery';

let $injector;
let $rootScope;
let $timeout;
let $compile;
let container;

// angularApp.run([
//   '$injector',
//   '$timeout',
//   '$rootScope',
//   '$state',
//   '$compile',
//   (_$injector, _$timeout, _$rootScope, _$state, _$compile) => {
//     $injector = _$injector;
//     $timeout = _$timeout;
//     $rootScope = _$rootScope;
//     $compile = _$compile;
//     $rootScope.myHtml = {};
//     $rootScope.myHtml.content = '<p>hooooo</p>';
//     $rootScope.injector = $injector;
//   },
// ]);

// angularApp.filter('to_trusted', [
//   '$sce',
//   ($sce) => {
//     return (text) => {
//       return $sce.trustAsHtml(text);
//     };
//   },
// ]);

// angularApp.run([
//   '$state',
//   ($state) => {
//     // $state.go = handleAngularRoute;
//   },
// ]);

// console.log('myapp', angularApp);

// console.log('my rootscope = ', $rootScope);

export default (App = () => {
  // useEffect(() => {
  //   angular.bootstrap(container, ['MyApp']);

  //   $rootScope.count = 0;
  //   $rootScope.okClick = () => {
  //     $rootScope.count++;
  //     console.log('Cliquei aqui!', $rootScope.count);
  //   };

  //   // reactDom.render(
  //   //   <DirectiveComponent />,
  //   //   document.querySelector('*[component-name="DirectiveComponent"]'),
  //   // );
  // }, []);

  const htmlTemplate = `
  <thiago-lindo></thiago-lindo>
  <my-button></my-button>
  <button class="button button-balanced icon-left ion-checkmark-round" ng-click="okClick()">
  OK {{count}}
  </button>
  <div class="my-class" ng-init="model.value = 'ng-model calculando = ' + (1+1)">
      {{model.value}}
  </div>
  <span ng-show="false">I'm not here</span>
  <span ng-show="true" class="my-class2">Ng-show = true</span>

  <DirectiveComponent component-name="DirectiveComponent"></DirectiveComponent>

  <div ng-bind-html="myHtml.content | to_trusted"></div>
  `;

  const [html, setHtml] = useState('');

  // useEffect(() => {
  //   console.log('html changed');

  //   let all = container.getElementsByTagName('*');
  //   $timeout(() => {
  //     $compile(angular.element(container))($rootScope);
  //     $rootScope.$digest();
  //   });
  // }, [html]);

  const handleAngularRoute = (state, params, options) => {
    props.history.push(state);
  };

  useEffect(() => {
    // getPage('src/webapp/index2.html')
    //   .then((result) => {
    //     $(document.getElementById('teste')).html(result);
    //   })
    //   .catch();
  }, []);
  return (
    <div
      dangerouslySetInnerHTML={{__html: '<div ui-view class="fill"></div> '}}
    />
    // <SafeAreaView style={{flex: 1}}>
    //   <ScrollView>
    //     <div name="ngApplication" ref={(c) => (container = c)}>
    //       {/* <div dangerouslySetInnerHTML={{__html: html}} /> */}
    //       <div id="teste"></div>
    //       <InnerHTML html={html} />
    //     </div>
    //     <Button
    //       onPress={() => {
    //         fetch('src/views/login.view.html')
    //           .then(async (result) => {
    //             setHtml(await result.text());
    //           })
    //           .catch((error) => {
    //             console.log(error);
    //           });
    //       }}
    //       title="Página Exemplo"
    //       color="#841584"
    //       accessibilityLabel="Learn more about this purple button"
    //     />
    //     <Button
    //       onPress={() => {
    //         getPage('src/views/other.view.html')
    //           .then((result) => {
    //             setHtml(result);
    //           })
    //           .catch();
    //       }}
    //       title="Página Principal"
    //       color="#3880ff"
    //       accessibilityLabel="Learn more about this purple button"
    //     />

    //     <Button
    //       onPress={() => {
    //         getPage('src/webapp/index2.html')
    //           .then((result) => {
    //             // setHtml(result);
    //             $(document.getElementById('teste')).html(result);
    //           })
    //           .catch();
    //       }}
    //       title="index"
    //       color="#3880ff"
    //       accessibilityLabel="Learn more about this purple button"
    //     />
    //   </ScrollView>
    // </SafeAreaView>
  );
});
