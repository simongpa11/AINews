import type { Metadata } from 'next'
import { Inter, Playfair_Display, Merriweather } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-merriweather' })

export const metadata: Metadata = {
  title: 'AI News Daily',
  description: 'Your daily dose of AI news, curated by ChatGPT.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${merriweather.variable}`}>{children}</body>
    </html>
  )
}
