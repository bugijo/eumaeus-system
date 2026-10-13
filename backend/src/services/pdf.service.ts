import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

const money = (value: string) => `R$ ${value.replace('.', ',')}`;

const render = (write: (doc: any) => void): Promise<Buffer> => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Producer: 'Eumaeus local' } });
  const candidates = [process.env.EUMAEUS_PDF_FONT, '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].filter(Boolean) as string[];
  const fontPath = candidates.find((candidate) => fs.existsSync(path.resolve(candidate)));
  if (fontPath) { doc.registerFont('EumaeusSans', fontPath); doc.font('EumaeusSans'); }
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  write(doc);
  doc.end();
});

export class PdfService {
  static accounting(report: any) {
    return render((doc) => {
      doc.fontSize(18).text('Resumo contábil Eumaeus');
      doc.moveDown(0.4).fontSize(10).text(`Clínica ${report.clinicId} · Período ${report.period.from} a ${report.period.to}`);
      doc.text(`Gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR')}`);
      doc.moveDown().fontSize(13).text('Totais');
      doc.fontSize(10);
      for (const [label, value] of Object.entries(report.totals)) doc.text(`${label}: ${money(String(value))}`);
      doc.moveDown().fontSize(13).text('Pendências e contagem');
      doc.fontSize(10).text(`Faturas: ${report.counts.invoices} · Pagamentos: ${report.counts.payments} · Despesas: ${report.counts.expenses}`);
      doc.text(`Despesas sem classificação: ${report.pendencies.unclassifiedExpenses}`);
      doc.text(`Faturas sem documento fiscal: ${report.pendencies.missingFiscalDocuments}`);
      doc.moveDown().fontSize(13).text('Faturas');
      doc.fontSize(9);
      report.invoices.forEach((invoice: any) => doc.text(`#${invoice.id} · ${invoice.createdAt instanceof Date ? invoice.createdAt.toISOString().slice(0, 10) : String(invoice.createdAt).slice(0, 10)} · ${invoice.status} · total ${money(invoice.totalAmount)} · recebido ${money(invoice.received)} · desconto ${money(invoice.discount)}`));
      doc.moveDown().fontSize(13).text('Despesas');
      doc.fontSize(9);
      report.expenses.forEach((expense: any) => doc.text(`#${expense.id} · ${String(expense.incurredAt).slice(0, 10)} · ${expense.description} · ${money(expense.amount)} · centro ${expense.resultCenter?.code || 'SEM_CLASSIFICACAO'}`));
    });
  }

  static prescription(prescription: any) {
    if (prescription.status !== 'APPROVED') throw new Error('Somente receitas aprovadas podem gerar documento PDF');
    return render((doc) => {
      doc.fontSize(18).text(prescription.clinicNameSnapshot);
      doc.moveDown(0.6).fontSize(12).text('Receita veterinária');
      doc.fontSize(10).text(`Receita #${prescription.id} · versão ${prescription.currentVersion}`);
      doc.text(`Pet: ${prescription.petNameSnapshot}`);
      doc.text(`Tutor: ${prescription.tutorNameSnapshot}`);
      doc.text(`Veterinária: ${prescription.veterinarianNameSnapshot}`);
      doc.text(`Status: ${prescription.status} · Assinatura: ${prescription.signatureMode}`);
      doc.moveDown().fontSize(12).text('Itens prescritos');
      doc.fontSize(10);
      (prescription.items || []).forEach((item: any, index: number) => {
        doc.moveDown(0.3).text(`${index + 1}. ${item.medication} — ${item.dosage}; ${item.frequency}; ${item.duration}${item.instructions ? `; ${item.instructions}` : ''}`);
      });
      doc.moveDown().fontSize(9).text('Documento privado, acessível somente mediante autorização autenticada. A assinatura indicada é visual e não constitui assinatura digital verificável.');
    });
  }
}
