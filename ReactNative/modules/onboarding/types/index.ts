export type OnboardingState = {
    showOnboarding: boolean;
    onboardingSlideIndex: number;
};

export interface IOnboardingSlideProps {
    img: number;
}

export interface ISkipProps {
    onPress: () => void;
    index: number;
    lastIdx: number;
}
