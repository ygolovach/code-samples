import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, Divider, Typography } from '@mui/material'
import { getCurrentUserInfo, setNewPassword } from 'api/requests/user'
import { HintsBlock } from 'components/HintsBlock'
import { Password } from 'components/Password'
import { ENTER_KEY_CODE } from 'constants/keysCodes'
import { useUserContext } from 'hooks'
import { AuthLayout } from 'layouts/AuthLayout'
import { snakeCase } from 'lodash'
import { NextPageWithLayout } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TokenStorage } from 'utils/auth'
import {
  atLeastOneLowercaseCharacterRegex,
  atLeastOneNumberRegex,
  atLeastOneUppercaseCharacterRegex,
} from 'utils/regex'
import { getUserHomeUrl } from 'utils/user'
import * as Yup from 'yup'

interface IFormInput {
  password: string
  passwordConfirm: string
}

const validationSchema = Yup.object({
  password: Yup.string()
    .trim()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      atLeastOneLowercaseCharacterRegex,
      'Password must contain at least one lowercase character'
    )
    .matches(
      atLeastOneUppercaseCharacterRegex,
      'Password must contain at least one uppercase character'
    )
    .matches(
      atLeastOneNumberRegex,
      'Password must contain at least one number'
    ),
  passwordConfirm: Yup.string()
    .trim()
    .oneOf([Yup.ref('password')], 'Passwords must match'),
})

const CreateNewPassword: NextPageWithLayout = () => {
  const { setUser } = useUserContext()
  const router = useRouter()
  const userId = router.query.userId as string
  const token = router.query.token as string

  const { control, formState, handleSubmit, trigger, watch } =
    useForm<IFormInput>({
      mode: 'all',
      defaultValues: {
        password: '',
        passwordConfirm: '',
      },
      resolver: yupResolver(validationSchema),
    })

  const watchPassword = watch('password')

  const onSubmit = async (data: IFormInput) => {
    if (!userId || !token) {
      return
    }

    try {
      const response = await setNewPassword({
        password: data.password,
        userId,
        token,
      })
      if (response?.data) {
        const { accessToken, refreshToken } = response.data
        const tokenStorage = TokenStorage.getInstance()
        tokenStorage.setAccessToken(accessToken)
        tokenStorage.setRefreshToken(refreshToken)

        try {
          const result = await getCurrentUserInfo()
          const user = result.data
          if (!user) {
            return
          }

          setUser(user)

          void router.push(getUserHomeUrl(user).pathname)
        } catch (error) {
          console.error(error)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const onEnterSubmit = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { keyCode, shiftKey } = event
    if (keyCode === ENTER_KEY_CODE && !shiftKey) {
      await handleSubmit(onSubmit)()
    }
  }

  return (
    <>
      <Typography
        variant='h6'
        sx={{
          fontSize: '17px',
          fontWeight: '600',
          lineHeight: '22px',
          textTransform: 'uppercase',
          marginBottom: '60px',
        }}
      >
        Create new password
      </Typography>
      <Box onKeyDown={onEnterSubmit}>
        <Controller
          name='password'
          control={control}
          render={({ field, fieldState }) => (
            <Password
              {...field}
              label='New password'
              onChange={event => {
                field.onChange(event)
                void trigger('passwordConfirm')
              }}
              id={snakeCase(field.name)}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? ''}
            />
          )}
        />

        <Controller
          name='passwordConfirm'
          control={control}
          render={({ field, fieldState }) => (
            <Password
              {...field}
              label='Confirm'
              id={snakeCase(field.name)}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? ''}
            />
          )}
        />

        <HintsBlock password={watchPassword} />
        <Box sx={{ margin: '30px 0 0' }}>
          <Button
            variant='contained'
            style={{
              width: '100%',
              textTransform: 'unset',
              boxShadow: 'none',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '30px',
              padding: '10px',
            }}
            sx={{
              '&:hover': {
                backgroundColor: '#008662',
              },
              '&:active': {
                backgroundColor: '#007153',
                boxShadow: 'none',
              },
              '&:focus': {
                backgroundColor: '#007153',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: '#009970',
              },
            }}
            disabled={formState.isSubmitting || !formState.isValid}
            onClick={handleSubmit(onSubmit)}
          >
            Save new password and log in
          </Button>
        </Box>
        <Divider
          sx={{
            margin: '40px 0',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography>Remember your password?</Typography>
          <Link passHref href='/account/login'>
            <Typography
              fontWeight={600}
              color='#009970'
              sx={{ cursor: 'pointer' }}
              marginLeft='15px'
            >
              Log in
            </Typography>
          </Link>
        </Box>
      </Box>
    </>
  )
}

CreateNewPassword.getLayout = page => {
  return <AuthLayout>{page}</AuthLayout>
}

export default CreateNewPassword
