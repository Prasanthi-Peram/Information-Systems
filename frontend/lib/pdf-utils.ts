import { jsPDF } from 'jspdf'

type PdfSection = {
  title: string
  lines: string[]
}

export function downloadPdfReport(filename: string, mainTitle: string, sections: PdfSection[]) {
  const doc = new jsPDF()

  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(mainTitle, 20, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const generatedAt = `Generated at: ${new Date().toLocaleString()}`
  doc.text(generatedAt, 20, y)
  y += 10

  sections.forEach((section) => {
    if (!section.lines.length) return

    if (y > 260) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(section.title, 20, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    section.lines.forEach((line) => {
      const split = doc.splitTextToSize(line, 170)
      split.forEach((wrappedLine: string) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(wrappedLine, 24, y)
        y += 6
      })
    })

    y += 4
  })

  doc.save(filename)
}

