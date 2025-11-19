'use client'

import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface QuickActionsProps {
  code: string
  description: string
  system?: string
  conversions?: any[]
  elixhauser?: any
  charlson?: any
}

export default function QuickActions({ code, description, system, conversions, elixhauser, charlson }: QuickActionsProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error(t('failedToCopy'), err)
    }
  }

  const generateCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,"

    // Header
    csvContent += "ICD Code,System,Description\n"
    csvContent += `"${code}","${system || 'N/A'}","${description}"\n\n`

    // Conversions
    if (conversions && conversions.length > 0) {
      csvContent += "\nConversions\n"
      csvContent += "Target Code,Target System,Description,Flags\n"
      conversions.forEach(conv => {
        csvContent += `"${conv.target_code}","${conv.target_system}","${conv.target_description || 'N/A'}","${conv.flags || 'N/A'}"\n`
      })
    }

    // Elixhauser
    if (elixhauser && elixhauser.categories) {
      csvContent += "\nElixhauser Comorbidities\n"
      csvContent += "Category,Description\n"
      elixhauser.categories.forEach((cat: any) => {
        csvContent += `"${cat.category}","${cat.description || 'N/A'}"\n`
      })
    }

    // Charlson
    if (charlson) {
      csvContent += "\nCharlson Index\n"
      csvContent += "Category,Weight,Score\n"
      csvContent += `"${charlson.category || 'N/A'}","${charlson.weight || 0}","${charlson.score || 0}"\n`
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `icd_${code.replace(/\./g, '_')}_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ICD Code Report - ${code}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .badge { background: #1e3a8a; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>ICD Code Analysis Report</h1>
        
        <div class="info-box">
          <h2>Primary Code Information</h2>
          <p><strong>Code:</strong> ${code}</p>
          <p><strong>System:</strong> ${system || 'N/A'}</p>
          <p><strong>Description:</strong> ${description}</p>
        </div>
    `

    // Conversions
    if (conversions && conversions.length > 0) {
      htmlContent += `
        <h2>Code Conversions <span class="badge">${conversions.length}</span></h2>
        <table>
          <thead>
            <tr>
              <th>Target Code</th>
              <th>System</th>
              <th>Description</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
      `
      conversions.forEach(conv => {
        htmlContent += `
          <tr>
            <td>${conv.target_code}</td>
            <td>${conv.target_system}</td>
            <td>${conv.target_description || 'N/A'}</td>
            <td>${conv.flags || 'N/A'}</td>
          </tr>
        `
      })
      htmlContent += '</tbody></table>'
    }

    // Elixhauser
    if (elixhauser && elixhauser.categories) {
      htmlContent += `
        <h2>Elixhauser Comorbidities <span class="badge">${elixhauser.totalCategories}</span></h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
      `
      elixhauser.categories.forEach((cat: any) => {
        htmlContent += `
          <tr>
            <td>${cat.category}</td>
            <td>${cat.description || 'N/A'}</td>
          </tr>
        `
      })
      htmlContent += '</tbody></table>'
    }

    // Charlson
    if (charlson) {
      htmlContent += `
        <h2>Charlson Comorbidity Index</h2>
        <div class="info-box">
          <p><strong>Category:</strong> ${charlson.category || 'N/A'}</p>
          <p><strong>Weight:</strong> ${charlson.weight || 0}</p>
          <p><strong>Score:</strong> ${charlson.score || 0}</p>
        </div>
      `
    }

    htmlContent += `
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #64748b; font-size: 12px;">
          <p>Generated by ICD Code Converter System - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer;">Print to PDF</button>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={() => handleCopy(code, 'code')}
        className="btn-icon"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copied === 'code' ? 'Copied!' : 'Copy Code'}
      </button>

      <button
        onClick={() => handleCopy(description, 'desc')}
        className="btn-icon"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {copied === 'desc' ? 'Copied!' : 'Copy Desc'}
      </button>

      <button
        onClick={() => handleCopy(`${code} - ${description}`, 'full')}
        className="btn-icon"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {copied === 'full' ? 'Copied!' : 'Copy Both'}
      </button>

      <button
        onClick={generatePDF}
        className="btn-icon"
        title="Export to PDF"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Export PDF
      </button>

      <button
        onClick={generateCSV}
        className="btn-icon"
        title="Export to CSV"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
    </div>
  )
}
