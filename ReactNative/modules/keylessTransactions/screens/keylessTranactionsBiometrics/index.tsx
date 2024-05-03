import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ENABLE_FACE_ID } from '../../../common/constants/text';
import {
    IRootStackParamList,
    NAVIGATION_KEYS,
} from '../../../navigation/types';
import { BoimetricChecking } from '../../../common/components/biometricChecking';
import { ScreenSkeleton } from '../../../common/components/screenSkeleton';
import { theme } from '../../../common/styles';
import { CommonHeader } from '../../../common/components/header';

export const KeylessTranasctionsBiometrics = () => {
    const { navigate } = useNavigation<
        StackNavigationProp<
            IRootStackParamList,
            NAVIGATION_KEYS.KEYLESS_TRANSACTIONS_BIOMETRICS
        >
    >();

    const handleBackPress = () => {
        navigate(NAVIGATION_KEYS.KEYLESS_TRANSACTIONS_CONFIRM);
    };

    return (
        <ScreenSkeleton
            isHeaderVisible={true}
            onLeftButtonPress={handleBackPress}
        >
            <View style={styles.container}>
                <BoimetricChecking text={ENABLE_FACE_ID} />
            </View>
        </ScreenSkeleton>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        backgroundColor: theme.colors.background,
        paddingTop: 35,
    },
});
