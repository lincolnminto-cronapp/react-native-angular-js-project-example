import { Button } from 'react-native';
import { keys } from 'ts-transformer-keys';
import { GetComponentProps } from './ComponentPropsUtil';

export function getButtonProps(): string[] {
    return  keys<GetComponentProps<typeof Button>>();
}

