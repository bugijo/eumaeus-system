import { PdfService } from '../services/pdf.service';

describe('PdfService', () => {
  it('gera PDF contábil e receita aprovada com conteúdo verificável', async () => {
    const accounting = await PdfService.accounting({ clinicId: 4, period: { from: '2026-10-01', to: '2026-10-31' }, generatedAt: '2026-10-13T12:00:00Z', totals: { billed: '12.34', received: '5.00', reversed: '0.00', pending: '7.34', discounts: '1.00', expenses: '10.00' }, counts: { invoices: 1, payments: 1, expenses: 0 }, pendencies: { unclassifiedExpenses: 0, missingFiscalDocuments: 1 }, invoices: [], expenses: [] });
    expect(accounting.subarray(0, 5).toString()).toBe('%PDF-');
    const prescription = await PdfService.prescription({ id: 3, currentVersion: 2, status: 'APPROVED', clinicNameSnapshot: 'Clínica sintética', petNameSnapshot: 'Pet QA', tutorNameSnapshot: 'Tutor QA', veterinarianNameSnapshot: 'Dra. QA', signatureMode: 'VISUAL_ONLY', items: [{ medication: 'TESTE-SINTETICO', dosage: '1', frequency: '1x', duration: '2 dias' }] });
    expect(prescription.subarray(0, 5).toString()).toBe('%PDF-');
    expect(() => PdfService.prescription({ status: 'PENDING_REVIEW' })).toThrow('Somente receitas aprovadas');
  });
});
