import { Switch } from 'react-native';
import { keys } from 'ts-transformer-keys';
import { GetComponentProps } from './ComponentPropsUtil';

export const getSwitchProps = (): string[] => keys<GetComponentProps<typeof Switch>>();


