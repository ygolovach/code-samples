import React from 'react';
import {
    StyleSheet,
    Text,
    useWindowDimensions,
    TouchableOpacity,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { colorPalette } from '../../../common/styles/color-palette';
import { NEXT, SKIP } from '../../../common/constants/text';
import { ISkipProps } from '../../types';

export const Skip = ({ onPress, index, lastIdx }: ISkipProps) => {
    const { width, height } = useWindowDimensions();

    const btnStyles: StyleProp<ViewStyle> = {
        bottom: height * 0.03,
        right: width * 0.115,
    };

    return (
        <TouchableOpacity onPress={onPress} style={[styles.skip, btnStyles]}>
            <Text style={styles.text}>{index === lastIdx ? NEXT : SKIP}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    text: { color: colorPalette.primary },
    skip: { position: 'absolute', zIndex: 123 },
});
