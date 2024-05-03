import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Typography } from '@mui/material'
import { resetPassword } from 'api/requests/user'
import { ButtonCustom } from 'components/Button'
import { Input } from 'components/Input'
import { LoginOffer } from 'components/LoginOffer'
import { AuthLayout } from 'layouts/AuthLayout'
import { snakeCase } from 'lodash'
import { NextPageWithLayout } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { emailRegex } from 'utils/regex'
import * as Yup from 'yup'

interface IFormInput {
  email: string
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .required('Email is required')
    .matches(emailRegex, 'Email is invalid'),
})

const ResetPassword: NextPageWithLayout = () => {
  const router = useRouter()
  const { control, handleSubmit, formState } = useForm<IFormInput>({
    mode: 'all',
    defaultValues: {
      email: '',
    },
    resolver: yupResolver(validationSchema),
  })

  const onSubmit = async (data: IFormInput) => {
    await resetPassword(data)

    await router.push(`/account/password/reset/link-sent?email=${data.email}`)
  }

  return (
    <>
      <Box
        sx={{
          pb: '40px',
          mb: '38px',
          borderBottom: '1px solid rgba(34, 34, 34, 0.12)',
        }}
      >
        <Box sx={{ pt: '58px' }}>
          <Typography sx={{ mb: '34px' }} fontSize={18}>
            Enter the email address associated with your account and we’ll send
            you a link to reset your password.
          </Typography>
          <Controller
            name='email'
            control={control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type='email'
                label='Email address'
                id={snakeCase(field.name)}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ''}
              />
            )}
          />
          <ButtonCustom
            sx={{ mt: '15px' }}
            disabled={formState.isSubmitting || !formState.isValid}
            onClick={handleSubmit(onSubmit)}
          >
            Reset password
          </ButtonCustom>
        </Box>
      </Box>
      <LoginOffer />
    </>
  )
}

ResetPassword.getLayout = page => {
  return <AuthLayout title='Forgot Password?'>{page}</AuthLayout>
}

export default ResetPassword
