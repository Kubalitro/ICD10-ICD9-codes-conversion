import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { LanguageProvider } from './context/LanguageContext'

export const metadata = {
  title: 'ICD Codes Converter - ICD-10 ↔ ICD-9',
  description: 'Herramienta para conversión bidireccional de códigos ICD-10 e ICD-9 con clasificación de comorbilidades Elixhauser y Charlson',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <LanguageProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
