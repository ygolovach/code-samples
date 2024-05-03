import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PinScreen } from '../../../common/components/pinScreen';
import {
    ENTER_PIN,
    KEYLESS_TRANSACTION_PIN_ENTER,
} from '../../../common/constants/text';
import {
    IRootStackParamList,
    NAVIGATION_KEYS,
} from '../../../navigation/types';

export const KeylessTranasctionsPinEnter = () => {
    const { navigate } = useNavigation<
        StackNavigationProp<
            IRootStackParamList,
            NAVIGATION_KEYS.KEYLESS_TRANSACTIONS_PIN_ENTER
        >
    >();

    const handleSubmitPress = () => {};
    const handleBackPress = () => {
        navigate(NAVIGATION_KEYS.KEYLESS_TRANSACTIONS_CONFIRM);
    };

    return (
        <PinScreen
            title={ENTER_PIN}
            text={KEYLESS_TRANSACTION_PIN_ENTER}
            onSubmit={handleSubmitPress}
            onBackButtonPress={handleBackPress}
        />
    );
};
