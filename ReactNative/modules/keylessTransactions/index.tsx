import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    ScrollView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { CommonHeader } from '../common/components/header';
import { theme } from '../common/styles';
import { FONT } from '../common/types';
import { CAMERA_NOT_AUTHORIZED } from '../common/constants/text';
import SafleLogo from '../../assets/icons/safle-beta-logo.svg';
import cameraSwitchIcon from '../../assets/icons/camera-switch.png';
import CameraFlashIcon from '../../assets/icons/flash.svg';
import { IRootStackParamList, NAVIGATION_KEYS } from '../navigation/types';

export const KeylessTranasctionsScanCode = () => {
    const navigation =
        useNavigation<
            StackNavigationProp<
                IRootStackParamList,
                NAVIGATION_KEYS.KEYLESS_TRANSACTIONS_SCAN_CODE
            >
        >();
    const devices = useCameraDevices();
    const [hasPermission, setHasPermission] = useState(false);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
    const [torchMode, setTorchMode] = useState<'on' | 'off'>('off');
    const [frameProcessor, barcodes] = useScanBarcodes(
        [BarcodeFormat.QR_CODE],
        {
            checkInverted: true,
        },
    );

    useEffect(() => {
        (async () => {
            const newCameraPermission = await Camera.requestCameraPermission();

            if (newCameraPermission === 'authorized') {
                setHasPermission(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (barcodes.length > 0) {
            if (barcodes[0].rawValue) {
                navigation.navigate(
                    NAVIGATION_KEYS.KEYLESS_LOGIN_CHOOSE_WALLET,
                );
            }
        }
    }, [barcodes, navigation]);

    const toggleCameraType = () => {
        setCameraType(prevValue => (prevValue === 'back' ? 'front' : 'back'));
    };

    const toggleTorchMode = () => {
        setTorchMode(prevValue => (prevValue === 'on' ? 'off' : 'on'));
    };

    const handleBackPress = () => {};

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <CommonHeader
                    onLeftButtonPress={handleBackPress}
                    centerElement={<SafleLogo />}
                />
            </View>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Scan the code</Text>
                {hasPermission && devices[cameraType] ? (
                    <>
                        <View style={styles.cameraContainer}>
                            <Camera
                                isActive
                                style={styles.camera}
                                device={devices[cameraType]}
                                torch={torchMode}
                                frameProcessor={frameProcessor}
                                frameProcessorFps={5}
                            />
                            <View style={[styles.targetGen, styles.topLeft]} />
                            <View style={[styles.targetGen, styles.topRight]} />
                            <View
                                style={[styles.targetGen, styles.bottomLeft]}
                            />
                            <View
                                style={[styles.targetGen, styles.bottomRight]}
                            />
                        </View>
                        <View style={styles.actionsWrapper}>
                            <TouchableOpacity onPress={toggleCameraType}>
                                <Image
                                    resizeMode="contain"
                                    source={cameraSwitchIcon}
                                    style={styles.cameraSwitchIcon}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.flashIcon}
                                onPress={toggleTorchMode}>
                                <CameraFlashIcon />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <Text style={styles.notAuthorizedMessage}>
                        {CAMERA_NOT_AUTHORIZED}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};
