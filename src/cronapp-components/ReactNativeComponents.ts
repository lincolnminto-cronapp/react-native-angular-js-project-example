import * as ReactNative from 'react-native';
import {react2angular} from 'react2angular';
import {keys} from 'ts-transformer-keys';
import {GetComponentProps} from '../react-native-components/ComponentPropsUtil';
import {angularApp} from './AngularApp';

export interface ComponentTypes {
  componentName: string;
  component: any;
  props: (string | number)[];
}

export const ComponentTypes: string = 'ComponentTypes';

export const loadReactNativeComponents = (): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      const componentTypes: Array<ComponentTypes> = [
        {
          componentName: 'rnButton',
          component: ReactNative.Button,
          props: keys<GetComponentProps<typeof ReactNative.Button>>(),
        },
        {
          componentName: 'rnSwitch',
          component: ReactNative.Switch,
          props: keys<GetComponentProps<typeof ReactNative.Switch>>(),
        },
        {
          componentName: 'rnText',
          component: ReactNative.Text,
          props: keys<GetComponentProps<typeof ReactNative.Text>>(),
        },
        {
          componentName: 'rnImage',
          component: ReactNative.Image,
          props: keys<GetComponentProps<typeof ReactNative.Image>>(),
        },
        {
          componentName: 'rnImage',
          component: ReactNative.TextInput,
          props: keys<GetComponentProps<typeof ReactNative.TextInput>>(),
        },
        {
          componentName: 'rnToastAndroid',
          component: ReactNative.ToastAndroid,
          props: keys<GetComponentProps<typeof ReactNative.ToastAndroid>>().map(value => String(value)),
        },
        {
          componentName: 'rnActionSheetIOS',
          component: ReactNative.ActionSheetIOS,
          props: keys<GetComponentProps<typeof ReactNative.ActionSheetIOS>>().map(value => String(value)),
        },
        {
          componentName: 'rnActivityIndicator',
          component: ReactNative.ActivityIndicator,
          props: keys<GetComponentProps<typeof ReactNative.ActivityIndicator>>(),
        },
        {
          componentName: 'rnAlert',
          component: ReactNative.Alert,
          props: keys<GetComponentProps<typeof ReactNative.Alert>>().map(value => String(value)),
        },
        {
          componentName: 'rnModal',
          component: ReactNative.Modal,
          props: keys<GetComponentProps<typeof ReactNative.Modal>>(),
        },
        {
          componentName: 'rnStatusBar',
          component: ReactNative.StatusBar,
          props: keys<GetComponentProps<typeof ReactNative.StatusBar>>(),
        },
      ];

      componentTypes.map(value => {
        angularApp.component(value.componentName.trim(), react2angular(value.component, value.props));
      });

      resolve(true);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};
