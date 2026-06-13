import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: '見積ツール',
  description: '社内向け見積管理システム',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
