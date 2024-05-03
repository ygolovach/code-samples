import React from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Text,
    Dimensions,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonHeader } from '../../../common/components/header';
import { theme } from '../../../common/styles';
import SafleLogo from '../../../../assets/icons/safle-beta-logo.svg';
import uniswapLogo from '../../../../assets/icons/uniswap.png';
import { LOGIN, UNISWAP_TIP } from '../../../common/constants/text';
import { Button } from '../../../common/components/button';
import {
    IRootStackParamList,
    NAVIGATION_KEYS,
} from '../../../navigation/types';
import { biomentricsService } from '../../../common/services/biometrics-checking.service';

export const KeylessTransactionsChooseWallet = () => {
    const { navigate } = useNavigation<
        StackNavigationProp<
            IRootStackParamList,
            NAVIGATION_KEYS.KEYLESS_LOGIN_CHOOSE_WALLET
        >
    >();

    const handleBackPress = () => {};

    const handleLoginPress = async () => {
        (await biomentricsService.checkBiometrics())
            ? navigate(NAVIGATION_KEYS.BACKUP_SEEDS_BIOMETRICS)
            : navigate(NAVIGATION_KEYS.BACKUP_SEEDS_ENTER_PIN);
    };

    return (
        <>
            <View style={styles.headerContainer}>
                <CommonHeader
                    onLeftButtonPress={handleBackPress}
                    centerElement={<SafleLogo />}
                />
            </View>
            <>
                <ScrollView style={styles.mainContainer}>
                    <View style={styles.titleContainer}>
                        <Image
                            resizeMode="contain"
                            source={uniswapLogo}
                            style={styles.uniswapLogo}
                        />
                    </View>
                    <Text style={styles.tip}>{UNISWAP_TIP}</Text>
                    <View style={styles.container}>
                        <View style={styles.content}></View>
                        <View style={styles.btnWrapper}>
                            <Button text={LOGIN} onPress={handleLoginPress} />
                        </View>
                    </View>
                </ScrollView>
            </>
        </>
    );
};
