import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { POLYGON_SCAN_URL } from '@env';
import { theme } from '../../../common/styles';
import Congratulations from '../../../../assets/icons/done.svg';
import {
    CHECK_ON_ETHERSCAN,
    DONE,
    TRANSACTION_SUCCESS,
} from '../../../common/constants/text';
import { ScreenSkeleton } from '../../../common/components/screenSkeleton';
import { Button } from '../../../common/components/button';
import { WebViewComponent } from '../../../common/components/webview';

export const KeylessTranasctionsSuccess = () => {
    const [isWebViewShown, setIsWebViewShown] = useState<boolean>(false);
    const handleDonePress = () => {};

    const handleEtherscanPress = () => {
        setIsWebViewShown(prevState => !prevState);
    };

    const createWebViewURI = (transactionHash: string) => {
        return `${POLYGON_SCAN_URL}/${transactionHash}`;
    };

    const WEBVIEW_URI = createWebViewURI('');

    return !isWebViewShown ? (
        <ScreenSkeleton isHeaderVisible={false} style={styles.skeleton}>
            <View style={styles.wrapper}>
                <View style={styles.congratulationsWrapper}>
                    <Congratulations />
                    <Text style={styles.header}>{TRANSACTION_SUCCESS}</Text>
                    <Text style={styles.descr}>TXN ID: 23456789XXXX78909</Text>
                </View>
                <View style={styles.hashWrapper}>
                    <View style={styles.infoWrapper}>
                        <Text style={styles.infoText}>
                            Amount: 1.2 ETHER ($1800.00)
                        </Text>
                        <Text style={styles.infoText}>
                            Fees: 0.2 ETHER ($787.00)
                        </Text>
                        <Text style={styles.infoText}>
                            Timestamp: 05:00 / 5th March 2021
                        </Text>
                    </View>
                    <Button
                        text={DONE}
                        onPress={handleDonePress}
                        style={styles.goToDashboardBtn}
                    />
                    <TouchableOpacity onPress={handleEtherscanPress}>
                        <Text style={styles.checkOnBlockchein}>
                            {CHECK_ON_ETHERSCAN}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenSkeleton>
    ) : (
        <WebViewComponent
            isVisible={isWebViewShown}
            toggleWebView={handleEtherscanPress}
            source={{
                uri: WEBVIEW_URI,
            }}
        />
    );
};
