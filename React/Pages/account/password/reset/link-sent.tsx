import { Box, Typography } from '@mui/material'
import { AuthInformation } from 'components/AuthInformation'
import { BigCircledTickIcon } from 'icons'
import { AuthLayout } from 'layouts/AuthLayout'
import { NextPageWithLayout } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

const ResetLinkSent: NextPageWithLayout = () => {
  const { query } = useRouter()
  return (
    <>
      <AuthInformation
        Icon={
          <BigCircledTickIcon
            width={64}
            height={64}
            viewBox='0 0 64 64'
            color='rgba(0, 153, 112, 1)'
          />
        }
      >
        <Typography textAlign='center' sx={{ mb: '16px' }}>
          The password restore link has been sent out to
          <b> {query.email}</b> If you don’t get the email, please check your
          spam folder or try another email address.
        </Typography>
        <Box display='flex'>
          <Typography>
            If the issue still persists, please contact our
          </Typography>
          <Link passHref href='/'>
            <Typography sx={{ color: '#009970', ml: '4px', cursor: 'pointer' }}>
              support.
            </Typography>
          </Link>
        </Box>
      </AuthInformation>
    </>
  )
}

ResetLinkSent.getLayout = page => {
  return (
    <AuthLayout isCenteredContent title='Success!'>
      {page}
    </AuthLayout>
  )
}

export default ResetLinkSent
