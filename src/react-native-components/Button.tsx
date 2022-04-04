import { Button } from 'react-native';
import { keys } from 'ts-transformer-keys';
import { GetComponentProps } from './ComponentPropsUtil';

export const getButtonProps = (): string[] => keys<GetComponentProps<typeof Button>>();


