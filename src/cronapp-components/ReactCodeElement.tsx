import { v4 as uuidv4 } from 'uuid';

import * as ReactNative from 'react-native';
import React, { ReactElement } from 'react';
import ReactDom from 'react-dom';

declare var teste: any;

declare global {
  interface Window {
    Babel: any;
  }
}

export const ThiagoFeio = (props: { count: number }) => {
  return <div>Thiago Feio {props.count} </div>
};

export const evaluate = (context: any, expr: string) => Function(Object.keys(context).join(','), expr)(...Object.values(context));


class ReactCodeElement extends HTMLScriptElement {

  constructor() {
    super();
  }

  connectedCallback() {
    const content = this.innerHTML;
    this.innerHTML = '';
    const container = document.createElement('div');
    setTimeout(() => {
      const componentName: string = `myComponent${uuidv4()}`.replace(/\-/gi, '');

      const completeScript = `
      window.${componentName} = (props) => {
        ${this.buildStatesVariables()}
        return <> ${content} </>
      };
      `;


      const transformedScript = window.Babel.transform(completeScript, { presets: ['env', 'react'] }).code;
      evaluate({ ...ReactNative, React, ThiagoFeio }, transformedScript);

      ReactDom.render(React.createElement((window as any)[componentName]), container, () => {
        this.replaceWith(...Array.from(container.childNodes))
      });

    });
  }

  buildStatesVariables(): string {
    const states = this.getAttribute('states') || '';
    let useStateScript = '';
    states.split(';').map(stateEntry => {
      const [getState, setState] = stateEntry.replace(/\[/gi, '').replace(/\]/gi, '').split(',');
      if (getState) {
        const setStateName = setState ? setState.trim() : 'set' + this.capitalizeFirstLetter(getState);
        let stateValue: any = this.getAttribute(getState);

        useStateScript += ` const [${getState.trim()}, ${setStateName}] = React.useState(${stateValue || ''}); `;
      }
    })
    return useStateScript;
  }

  capitalizeFirstLetter(text: string) {
    return text.trim().charAt(0).toUpperCase() + text.slice(1);
  }

}

window.customElements.define('react-code', ReactCodeElement, { extends: 'script' });
