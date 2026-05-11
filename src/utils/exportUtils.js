import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

// PDF Export Utilities
export class PDFExporter {
  constructor(currency = '$') {
    try {
      this.pdf = new jsPDF()
      this.currency = currency
      this.pageWidth = this.pdf.internal.pageSize.getWidth()
      this.margin = 20
      this.contentWidth = this.pageWidth - (this.margin * 2)
      this.currentY = this.margin
      console.log('PDFExporter initialized successfully', { currency, pageWidth: this.pageWidth })
    } catch (error) {
      console.error('Failed to initialize PDFExporter:', error)
      throw new Error(`PDF initialization failed: ${error.message}`)
    }
  }

  addTitle(title, fontSize = 18) {
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += fontSize + 5
  }

  addSubtitle(subtitle, fontSize = 12) {
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(subtitle, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += fontSize + 3
  }

  addText(text, fontSize = 10) {
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'normal')
    const lines = this.pdf.splitTextToSize(text, this.contentWidth)
    lines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY)
      this.currentY += fontSize + 2
    })
  }

  addTable(headers, data, columnWidths) {
    const tableStartY = this.currentY
    const rowHeight = 10
    const fontSize = 9
    const cellPadding = 2

    // Check if table fits on current page
    const estimatedTableHeight = (data.length + 1) * (rowHeight + 2) + 20
    if (this.currentY + estimatedTableHeight > this.pdf.internal.pageSize.getHeight() - 30) {
      this.pdf.addPage()
      this.currentY = this.margin
    }

    // Headers
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFillColor(240, 240, 240)
    
    headers.forEach((header, index) => {
      const cellWidth = columnWidths[index] * this.contentWidth / 100
      const x = this.margin + (index > 0 ? columnWidths.slice(0, index).reduce((a, b) => a + b, 0) * this.contentWidth / 100 : 0)
      
      // Draw header background
      this.pdf.rect(x, this.currentY, cellWidth, rowHeight, 'F')
      
      // Draw header border
      this.pdf.rect(x, this.currentY, cellWidth, rowHeight)
      
      // Add header text
      this.pdf.text(header, x + cellPadding, this.currentY + rowHeight/2 + 2)
    })
    
    this.currentY += rowHeight

    // Data rows
    this.pdf.setFont('helvetica', 'normal')
    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (this.currentY + rowHeight > this.pdf.internal.pageSize.getHeight() - 30) {
        this.pdf.addPage()
        this.currentY = this.margin
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250)
        
        // Draw alternating row background
        this.pdf.rect(
          this.margin, 
          this.currentY, 
          this.contentWidth, 
          rowHeight, 
          'F'
        )
      }

      // Draw row border
      this.pdf.rect(this.margin, this.currentY, this.contentWidth, rowHeight)

      row.forEach((cell, cellIndex) => {
        const cellWidth = columnWidths[cellIndex] * this.contentWidth / 100
        const x = this.margin + (cellIndex > 0 ? columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0) * this.contentWidth / 100 : 0)
        let displayValue = cell
        
        // Format currency values (skip first column which is usually receipt/date)
        if (typeof cell === 'number' && cellIndex > 0 && cellIndex !== 4) { // Don't format item count column
          displayValue = this.currency + cell.toFixed(2)
        }
        
        // Ensure displayValue is always a string
        if (displayValue === null || displayValue === undefined) {
          displayValue = ''
        } else {
          displayValue = String(displayValue)
        }
        
        // Truncate text if too long
        const maxWidth = cellWidth - (cellPadding * 2)
        const textWidth = this.pdf.getTextWidth(displayValue)
        if (textWidth > maxWidth) {
          let truncated = displayValue
          while (this.pdf.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          displayValue = truncated + '...'
        }
        
        this.pdf.text(displayValue, x + cellPadding, this.currentY + rowHeight/2 + 2)
      })
      
      this.currentY += rowHeight
    })

    this.currentY += 15
  }

  addChart(chartImage, width = 150, height = 100) {
    const x = (this.pageWidth - width) / 2
    this.pdf.addImage(chartImage, 'PNG', x, this.currentY, width, height)
    this.currentY += height + 10
  }

  save(filename) {
    try {
      console.log('Saving PDF with filename:', filename)
      this.pdf.save(filename)
      console.log('PDF saved successfully')
    } catch (error) {
      console.error('Failed to save PDF:', error)
      throw new Error(`Failed to save PDF: ${error.message}`)
    }
  }
}

// Excel Export Utilities
export class ExcelExporter {
  constructor() {
    this.workbook = XLSX.utils.book_new()
  }

  addWorksheet(data, sheetName, options = {}) {
    const worksheet = XLSX.utils.json_to_sheet(data, options)
    
    // Auto-size columns
    const colWidths = this.calculateColumnWidths(data)
    worksheet['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName)
  }

  calculateColumnWidths(data) {
    if (!data || data.length === 0) return []
    
    const keys = Object.keys(data[0])
    return keys.map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
      return { width: Math.min(maxLength + 2, 50) }
    })
  }

  addSummarySheet(summary, sheetName = 'Summary') {
    const summaryData = Object.entries(summary).map(([key, value]) => ({
      Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      Value: typeof value === 'number' ? value.toFixed(2) : value
    }))
    
    this.addWorksheet(summaryData, sheetName)
  }

  save(filename) {
    const excelBuffer = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
  }
}

// Report-specific export functions
// Simple test PDF export function
export const exportTestPDF = async (filename = 'test-report') => {
  try {
    console.log('Starting test PDF export...')
    
    const exporter = new PDFExporter('$')
    
    // Title and metadata
    exporter.addTitle('Test Report')
    exporter.addSubtitle(`Generated: ${format(new Date(), 'PPP')}`)
    
    // Simple content
    exporter.addText('This is a test PDF to verify the export functionality works.', 12)
    exporter.addText('If you can see this PDF, the export system is working correctly.', 12)
    
    // Simple test table
    const headers = ['Test', 'Value', 'Status']
    const columnWidths = [33, 33, 34]
    const tableData = [
      ['PDF Export', 'Working', '✓'],
      ['jsPDF Library', 'Loaded', '✓'],
      ['File Generation', 'Success', '✓']
    ]
    
    exporter.addTable(headers, tableData, columnWidths)

    console.log('Saving test PDF...')
    exporter.save(`${filename}.pdf`)
    console.log('Test PDF export completed successfully')
  } catch (error) {
    console.error('Test PDF export failed:', error)
    throw new Error(`Failed to export test PDF: ${error.message}`)
  }
}

export const exportSalesReportPDF = async (reportData, summary, currency = '$', filename = 'sales-report') => {
  try {
    console.log('Starting PDF export...', { reportDataLength: reportData?.length, summary, currency, filename })
    
    const exporter = new PDFExporter(currency)
    
    // Title and metadata
    exporter.addTitle('Sales Report')
    exporter.addSubtitle(`Generated: ${format(new Date(), 'PPP')}`)
    
    // Summary section
    exporter.addText('Summary', 14)
    exporter.addText(`Total Sales: ${currency}${(summary.totalSales || 0).toFixed(2)}`)
    exporter.addText(`Net Sales: ${currency}${(summary.netSales || 0).toFixed(2)}`)
    exporter.addText(`Total Discounts: ${currency}${(summary.totalDiscounts || 0).toFixed(2)}`)
    exporter.addText(`Transactions: ${summary.transactionCount || 0}`)
    exporter.currentY += 15

    // Detailed transactions table
    if (reportData && reportData.length > 0) {
      exporter.addText('Transaction Details', 14)
      
      const headers = ['Receipt #', 'Date', 'Cashier', 'Payment', 'Items', 'Gross', 'Discount', 'Net']
      const columnWidths = [12, 15, 15, 12, 8, 12, 12, 14]
      
      const tableData = reportData.map(bill => {
        const grossTotal = bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
        return [
          bill.receiptNo || 'N/A',
          bill.createdAt ? format(new Date(bill.createdAt), 'MMM dd, yyyy') : 'N/A',
          bill.cashierName || 'Unknown',
          bill.paymentMethod || 'N/A',
          bill.itemCount || 0,
          grossTotal.toFixed(2),
          (bill.discountAmount || 0).toFixed(2),
          (bill.total || 0).toFixed(2)
        ]
      })
      
      exporter.addTable(headers, tableData, columnWidths)
    } else {
      exporter.addText('No transaction data available for the selected period.')
    }

    console.log('Saving PDF...')
    exporter.save(`${filename}.pdf`)
    console.log('PDF export completed successfully')
  } catch (error) {
    console.error('PDF export failed:', error)
    throw new Error(`Failed to export PDF: ${error.message}`)
  }
}

export const exportSalesReportExcel = (reportData, summary, currency = '$', filename = 'sales-report') => {
  const exporter = new ExcelExporter()
  
  // Add summary sheet with currency
  const summaryWithCurrency = {
    'Total Sales': `${currency}${(summary.totalSales || 0).toFixed(2)}`,
    'Net Sales': `${currency}${(summary.netSales || 0).toFixed(2)}`,
    'Total Discounts': `${currency}${(summary.totalDiscounts || 0).toFixed(2)}`,
    'Total Tax': `${currency}${(summary.totalTax || 0).toFixed(2)}`,
    'Transaction Count': summary.transactionCount || 0,
    'Average Transaction Value': `${currency}${(summary.transactionCount ? (summary.netSales / summary.transactionCount) : 0).toFixed(2)}`
  }
  exporter.addSummarySheet(summaryWithCurrency, 'Summary')
  
  // Add detailed transactions sheet
  if (reportData && reportData.length > 0) {
    const transactionsData = reportData.map(bill => ({
      'Receipt Number': bill.receiptNo || 'N/A',
      'Date': bill.createdAt ? format(new Date(bill.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      'Cashier': bill.cashierName || 'Unknown',
      'Payment Method': bill.paymentMethod || 'N/A',
      'Customer': bill.customer?.name || 'N/A',
      'Item Count': bill.itemCount || 0,
      'Subtotal': `${currency}${(bill.subtotal || 0).toFixed(2)}`,
      'Discount Amount': `${currency}${(bill.discountAmount || 0).toFixed(2)}`,
      'Tax Amount': `${currency}${(bill.taxAmount || 0).toFixed(2)}`,
      'Total': `${currency}${(bill.total || 0).toFixed(2)}`,
      'Organization': bill.orgName || 'N/A'
    }))
    
    exporter.addWorksheet(transactionsData, 'Transactions')
  }

  exporter.save(`${filename}.xlsx`)
}

export const exportProductPerformanceExcel = (productData, currency = '$', filename = 'product-performance') => {
  const exporter = new ExcelExporter()
  
  // Product performance data with currency
  const performanceData = productData.map(product => ({
    'Product Name': product.name || 'N/A',
    'Category': product.category || 'N/A',
    'SKU': product.sku || 'N/A',
    'Units Sold': product.unitsSold || 0,
    'Revenue': `${currency}${(product.revenue || 0).toFixed(2)}`,
    'Cost': `${currency}${(product.cost || 0).toFixed(2)}`,
    'Profit': `${currency}${(product.profit || 0).toFixed(2)}`,
    'Profit Margin': `${(product.revenue ? ((product.profit / product.revenue) * 100) : 0).toFixed(1)}%`,
    'Average Price': `${currency}${(product.unitsSold ? (product.revenue / product.unitsSold) : 0).toFixed(2)}`,
    'Stock Remaining': product.stock || 0
  }))
  
  exporter.addWorksheet(performanceData, 'Product Performance')
  
  // Category summary with currency
  const categorySummary = productData.reduce((acc, product) => {
    const category = product.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = {
        category,
        unitsSold: 0,
        revenue: 0,
        profit: 0
      }
    }
    acc[category].unitsSold += product.unitsSold || 0
    acc[category].revenue += product.revenue || 0
    acc[category].profit += product.profit || 0
    return acc
  }, {})
  
  const categorySummaryWithCurrency = Object.values(categorySummary).map(cat => ({
    'Category': cat.category,
    'Units Sold': cat.unitsSold,
    'Revenue': `${currency}${cat.revenue.toFixed(2)}`,
    'Profit': `${currency}${cat.profit.toFixed(2)}`
  }))
  
  exporter.addWorksheet(categorySummaryWithCurrency, 'Category Summary')
  
  exporter.save(`${filename}.xlsx`)
}

export const exportComparativeAnalysisExcel = (comparisonData, filename = 'comparative-analysis') => {
  const exporter = new ExcelExporter()
  
  const analysisData = comparisonData.map(item => ({
    'Period': item.period || '',
    'Current Value': item.currentValue || 0,
    'Previous Value': item.previousValue || 0,
    'Change': item.change || 0,
    'Percentage Change': item.percentageChange || 0,
    'Trend': item.trend || ''
  }))
  
  exporter.addWorksheet(analysisData, 'Comparative Analysis')
  
  exporter.save(`${filename}.xlsx`)
}

// Utility function to capture chart as image for PDF export
export const captureChartForPDF = (chartRef) => {
  return new Promise((resolve) => {
    if (!chartRef.current) {
      resolve(null)
      return
    }

    const svgElement = chartRef.current.container.querySelector('svg')
    if (!svgElement) {
      resolve(null)
      return
    }

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}
