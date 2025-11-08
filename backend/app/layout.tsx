export const metadata = {
  title: 'ICD Codes API',
  description: 'API para conversión de códigos ICD-10 ↔ ICD-9 y clasificación de comorbilidades',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#fafafa' }}>{children}</body>
    </html>
  )
}
