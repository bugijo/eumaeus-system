import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface NfeLot { code: string; quantity: number; expiresAt: string | null; manufacturedAt: string | null }
export interface NfePreviewLine {
  nItem: number; code: string; ean: string | null; name: string; ncm: string | null; unit: string;
  quantity: number; unitCost: number; total: string; anvisa: string | null; lots: NfeLot[];
  suggestion: { productId: number; productName: string; unitsPerPackage: number; source: 'fornecedor' | 'codigo_barras' } | null;
}
export interface NfePreview {
  accessKey: string; number: string; series: string; issuedAt: string;
  supplier: { document: string; name: string; tradeName: string | null }; recipientDocument: string | null;
  total: string; authorized: boolean; warnings: string[];
  alreadyImported: { id: number; at: string; by: string | null } | null;
  lines: NfePreviewLine[];
}
export type LineAction = 'link' | 'create' | 'skip';
export interface LineDecision { nItem: number; action: LineAction; productId?: number; unitsPerPackage: number; name?: string; salePrice?: number | null }
export interface NfeImportInput { xml: string; lines: LineDecision[]; updateCost: boolean; createExpense: boolean; resultCenterId?: number }
export interface NfeImportResult { id: number; number: string; supplierName: string; total: string; expenseId: number | null; received: number; created: number; skipped: number; units: number }
export interface PurchaseInvoiceRow { id: number; createdAt: string; accessKey: string; number: string; series: string; issuedAt: string; supplierName: string; supplierDocument: string; total: string; itemsCount: number; importedBy: string | null; expenseId: number | null }

export const purchaseInvoiceApi = {
  preview: async (xml: string) => (await apiClient.post<NfePreview>('/inventory/nfe/preview', { xml })).data,
  import: async (input: NfeImportInput) => (await apiClient.post<NfeImportResult>('/inventory/nfe/import', input)).data,
  list: async () => (await apiClient.get<PurchaseInvoiceRow[]>('/inventory/nfe')).data,
  downloadXml: async (id: number) => (await apiClient.get<Blob>(`/inventory/nfe/${id}/xml`, { responseType: 'blob' })).data,
};

export const useNfeImports = () => useQuery({ queryKey: ['nfe-imports'], queryFn: purchaseInvoiceApi.list });
export const useNfePreview = () => useMutation({ mutationFn: purchaseInvoiceApi.preview });
export const useNfeImport = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: purchaseInvoiceApi.import,
    onSuccess: () => {
      for (const key of [['nfe-imports'], ['products'], ['stock-stats'], ['financial']]) client.invalidateQueries({ queryKey: key });
    },
  });
};
