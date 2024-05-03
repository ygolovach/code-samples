import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Swiper from 'react-native-swiper';
import img0 from '../../assets/images/onboarding0.jpg';
import img1 from '../../assets/images/onboarding1.jpg';
import img2 from '../../assets/images/onboarding2.jpg';
import { asyncStorage } from '../common/services/async-storage.service';
import { theme } from '../common/styles';
import { STORAGE_KEYS } from '../common/types';
import { IRootStackParamList, NAVIGATION_KEYS } from '../navigation/types';
import { OnboardingSlide, Skip } from './components';

const CONTENT: number[] = [img0, img1, img2];

const lastIdx = 2;

export const Onboarding = () => {
    const [index, setIndex] = useState(0);

    const swiper = useRef<Swiper>(null);
    const navigation = useNavigation<
        StackNavigationProp<IRootStackParamList, NAVIGATION_KEYS.ONBOARDING>
    >();

    const setOnboarded = async () => {
        await asyncStorage.setData(
            STORAGE_KEYS.ONBOARDED,
            STORAGE_KEYS.ONBOARDED
        );
    };

    const onIndexChanged = (idx: number) => {
        setIndex(idx);
        if (idx === lastIdx) setOnboarded();
    };

    const skip = () => {
        setOnboarded();
        navigation.replace(NAVIGATION_KEYS.LOGIN, { isFatal: false });
    };

    return (
        <>
            <Swiper
                ref={swiper}
                loop={false}
                onIndexChanged={onIndexChanged}
                dotColor={theme.colors.primary}
                activeDotColor={theme.colors.blue}
                dotStyle={[styles.inactiveDot, styles.dot]}
                activeDotStyle={[styles.activeDot, styles.dot]}
            >
                {CONTENT.map((item, idx) => (
                    <OnboardingSlide img={item} key={idx} />
                ))}
            </Swiper>
            <Skip index={index} lastIdx={lastIdx} onPress={skip} />
        </>
    );
};

const styles = StyleSheet.create({
    dot: { marginLeft: 10, marginRight: 10 },
    activeDot: { width: 6, height: 6 },
    inactiveDot: { width: 4, height: 4 },
});
