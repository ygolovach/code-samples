import React from 'react'
import { colorPalette } from '../../../common/styles/color-palette'
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { IOnboardingSlideProps } from '../../types'

export const OnboardingSlide = ({ img }: IOnboardingSlideProps) => {
  const { width, height } = useWindowDimensions()

  const imageStyles: StyleProp<ImageStyle> = {
    width,
    height,
  }

  return (
    <View style={styles.slide}>
      <Image source={img} style={[imageStyles, styles.image]} />
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colorPalette.background,
  },
  image: { resizeMode: 'contain' },
})
