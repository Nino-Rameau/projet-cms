import { Providers } from '@/components/providers/Providers'
import ThemeInit from '@/components/ui/ThemeInit'
import './globals.css'

export const metadata = {
  title: 'PageBlanche CMS',
  description: 'Visual Builder Full-Stack',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
      </head>
      <body>
        <ThemeInit />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
