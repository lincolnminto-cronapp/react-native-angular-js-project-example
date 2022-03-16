import angular from 'angular';
import angularApp from './app';

const myButton = angularApp.directive('myButton', [
  '$compile',
  ($compile) => {
    return {
      link: (scope, element, attrs, ctrl) => {
        console.log('creating my directive');
        element.html(`
      <div class="list">
      
      <button class="button button-full button-light icon-left ion-outlet">
        button-light
      </button>
      
      <button class="button button-full icon-left ion-cash button-stable">
        button-stable
      </button>
      
      <button class="button button-full icon-left ion-funnel button-positive">
        button-positive
      </button>
      
      <button class="button button-full icon-left ion-scissors button-calm">
        button-calm
      </button>
      
      <button class="button button-full icon-left ion-chatbubble-working button-balanced">
        button-balanced
      </button>
      
      <button class="button button-full icon-left ion-beer button-energized">
        button-energized
      </button>
      
      <button class="button-full button icon-left ion-bug button-assertive">
        button-assertive
      </button>
      
      <button class="button button-full icon-left ion-xbox button-royal">
        button-royal
      </button>
      
      <button class="button button-full icon-left ion-happy button-dark">
        button-dark
      </button>
      
      </div>`);
      },
    };
  },
]);

const thiagoLindo = angularApp.component('thiagoLindo', {
  template: `<div class="thiago"><img class="heart" src="src/images/heart.gif">Thiago Lindo!!!!!<img  class="heart" src="src/images/heart.gif"></div>`,
});

module.exports = {
  myButton,
  thiagoLindo,
};
