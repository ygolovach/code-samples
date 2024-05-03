import { Grid, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { useUserContext } from 'hooks'
import { LogoIcon, PatternIcon } from 'icons'
import Link from 'next/link'
import React, { FC, useEffect } from 'react'
import { isBrowser } from 'utils/environment'
import { getUserHomeUrl } from 'utils/user'

import { AuthLayoutProps } from './AuthLayout.types'

export const AuthLayout: FC<React.PropsWithChildren<AuthLayoutProps>> = ({
  children,
  title,
  isCenteredContent,
}) => {
  const { user } = useUserContext()

  useEffect(() => {
    if (isBrowser()) {
      window?.document?.querySelector('body')?.classList.add('with-background')
    }
    return () => {
      window?.document
        ?.querySelector('body')
        ?.classList.remove('with-background')
    }
  }, [])

  return (
    <Box
      position={'relative'}
      sx={{
        bgcolor: 'secondary.main',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: {
          xs: '80px',
          sm: '112px',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          left: {
            xs: '0',
            sm: '88px',
          },
          right: '0',
          textAlign: {
            xs: 'center',
            md: 'left',
          },
        }}
      >
        <Link passHref href={getUserHomeUrl(user).pathname}>
          <Box>
            <LogoIcon
              width={141}
              height={28}
              color='white'
              style={{ cursor: 'pointer' }}
            />
          </Box>
        </Link>
      </Box>
      <Grid
        sx={{
          minWidth: {
            xs: '100%',
            sm: '724px',
          },
          position: 'relative',
          px: {
            xs: '16px',
            sm: '88px',
          },
        }}
      >
        <Box
          sx={{
            maxWidth: '548px',
            minWidth: {
              xs: '100%',
              sm: '548px',
            },
            minHeight: '560px',
            bgcolor: 'rgba(255, 255, 255, 1)',
            borderRadius: '16px',
            p: {
              xs: '38px 16px',
              sm: '38px 40px',
            },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Boolean(title) && (
            <Typography
              textAlign={isCenteredContent ? 'center' : 'left'}
              variant='h3'
              textTransform='uppercase'
              fontWeight={600}
              fontSize={17}
            >
              {title}
            </Typography>
          )}
          {children}
        </Box>
      </Grid>
      <Box
        sx={{
          position: 'absolute',
          overflow: 'hidden',
          right: 0,
          top: 0,
          height: '100%',
          width: '49vw',
          maxWidth: 'calc(100vw - 548px - 108px)',
          display: {
            xs: 'none',
            sm: 'block',
          },
        }}
      >
        <PatternIcon
          width={'100%'}
          height={'100%'}
          viewBox='0 0 808 1431'
          preserveAspectRatio='xMinYMin slice'
          color='#008662'
        />
      </Box>
    </Box>
  )
}
