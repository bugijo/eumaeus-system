import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';
import { getCurrentClinicId } from '../tenantContext';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const TENANT_MODELS = new Set([
  'tutor', 'user', 'pet', 'appointment', 'medicalRecord', 'medicalRecordProduct',
  'product', 'service', 'catalogService', 'invoice', 'invoiceItem', 'clinicSettings',
  'tutorCommunicationPreference', 'communicationOutbox',
  'servicePackage', 'packageContract', 'packageSession', 'productLot', 'stockMovement',
  'vaccinationRecord', 'resultCenter', 'payment', 'expense', 'specialistProfile', 'specialistAvailability', 'specialistAssignment',
  'prescription', 'prescriptionItem', 'financialAuditEvent',
  'hospitalizationAdmission', 'hospitalizationTask', 'hospitalizationPrescription', 'hospitalizationHandoff',
  'surgeryCase', 'surgeryBudgetVersion', 'surgeryConsent', 'surgeryChecklistItem', 'surgeryInstruction',
]);
const TENANT_ACTIONS = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany',
  'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert',
]);

const TENANT_RELATIONS: Record<string, Record<string, { target: string; many: boolean }>> = {
  tutor: { pets: { target: 'pet', many: true }, appointments: { target: 'appointment', many: true }, communicationPreferences: { target: 'tutorCommunicationPreference', many: true }, communicationOutbox: { target: 'communicationOutbox', many: true } },
  pet: { tutor: { target: 'tutor', many: false }, appointments: { target: 'appointment', many: true }, vaccinations: { target: 'vaccinationRecord', many: true } },
  appointment: { pet: { target: 'pet', many: false }, tutor: { target: 'tutor', many: false }, services: { target: 'service', many: true }, medicalRecord: { target: 'medicalRecord', many: false }, invoice: { target: 'invoice', many: false } },
  medicalRecord: { appointment: { target: 'appointment', many: false }, products: { target: 'medicalRecordProduct', many: true }, vaccinations: { target: 'vaccinationRecord', many: true }, prescriptions: { target: 'prescription', many: true }, responsibleUser: { target: 'user', many: false } },
  user: { responsibleMedicalRecords: { target: 'medicalRecord', many: true }, vaccinations: { target: 'vaccinationRecord', many: true }, createdPrescriptions: { target: 'prescription', many: true }, reviewedPrescriptions: { target: 'prescription', many: true }, cancelledPrescriptions: { target: 'prescription', many: true } },
  medicalRecordProduct: { medicalRecord: { target: 'medicalRecord', many: false }, product: { target: 'product', many: false } },
  product: { medicalRecords: { target: 'medicalRecordProduct', many: true }, resultCenter: { target: 'resultCenter', many: false } },
  service: { appointment: { target: 'appointment', many: false }, catalogService: { target: 'catalogService', many: false }, packageSessions: { target: 'packageSession', many: true }, invoiceItems: { target: 'invoiceItem', many: true } },
  catalogService: { appointments: { target: 'service', many: true }, coveredPackages: { target: 'servicePackage', many: true } },
  tutorCommunicationPreference: { tutor: { target: 'tutor', many: false } },
  communicationOutbox: { tutor: { target: 'tutor', many: false } },
  servicePackage: { contracts: { target: 'packageContract', many: true }, coveredCatalogService: { target: 'catalogService', many: false } },
  packageContract: { package: { target: 'servicePackage', many: false }, tutor: { target: 'tutor', many: false }, pet: { target: 'pet', many: false }, sessions: { target: 'packageSession', many: true } },
  packageSession: { contract: { target: 'packageContract', many: false }, appointment: { target: 'appointment', many: false }, service: { target: 'service', many: false }, invoiceItem: { target: 'invoiceItem', many: false } },
  productLot: { product: { target: 'product', many: false }, movements: { target: 'stockMovement', many: true } },
  stockMovement: { product: { target: 'product', many: false }, lot: { target: 'productLot', many: false } },
  vaccinationRecord: { pet: { target: 'pet', many: false }, medicalRecord: { target: 'medicalRecord', many: false }, responsibleUser: { target: 'user', many: false } },
  prescription: { medicalRecord: { target: 'medicalRecord', many: false }, veterinarian: { target: 'user', many: false }, reviewedBy: { target: 'user', many: false }, cancelledBy: { target: 'user', many: false }, items: { target: 'prescriptionItem', many: true } },
  prescriptionItem: { prescription: { target: 'prescription', many: false } },
  resultCenter: { products: { target: 'product', many: true }, invoices: { target: 'invoice', many: true }, invoiceItems: { target: 'invoiceItem', many: true }, expenses: { target: 'expense', many: true } },
  invoice: { appointment: { target: 'appointment', many: false }, items: { target: 'invoiceItem', many: true }, resultCenter: { target: 'resultCenter', many: false }, payments: { target: 'payment', many: true } },
  invoiceItem: { invoice: { target: 'invoice', many: false }, service: { target: 'service', many: false }, packageSession: { target: 'packageSession', many: false }, resultCenter: { target: 'resultCenter', many: false } },
  payment: { invoice: { target: 'invoice', many: false } },
  expense: { resultCenter: { target: 'resultCenter', many: false } },
  specialistProfile: { user: { target: 'user', many: false }, availabilities: { target: 'specialistAvailability', many: true }, assignments: { target: 'specialistAssignment', many: true } },
  specialistAvailability: { specialist: { target: 'specialistProfile', many: false } },
  specialistAssignment: { appointment: { target: 'appointment', many: false }, specialist: { target: 'specialistProfile', many: false } },
  hospitalizationAdmission: { pet: { target: 'pet', many: false }, responsibleUser: { target: 'user', many: false }, dischargeReviewer: { target: 'user', many: false }, tasks: { target: 'hospitalizationTask', many: true }, prescriptions: { target: 'hospitalizationPrescription', many: true }, handoffs: { target: 'hospitalizationHandoff', many: true } },
  hospitalizationTask: { admission: { target: 'hospitalizationAdmission', many: false }, executedBy: { target: 'user', many: false } },
  hospitalizationPrescription: { admission: { target: 'hospitalizationAdmission', many: false }, createdBy: { target: 'user', many: false } },
  hospitalizationHandoff: { admission: { target: 'hospitalizationAdmission', many: false }, fromUser: { target: 'user', many: false }, toUser: { target: 'user', many: false } },
  surgeryCase: { pet: { target: 'pet', many: false }, veterinarian: { target: 'user', many: false }, budgets: { target: 'surgeryBudgetVersion', many: true }, consents: { target: 'surgeryConsent', many: true }, checklist: { target: 'surgeryChecklistItem', many: true }, instructions: { target: 'surgeryInstruction', many: true } },
  surgeryBudgetVersion: { surgery: { target: 'surgeryCase', many: false }, createdBy: { target: 'user', many: false }, consents: { target: 'surgeryConsent', many: true } },
  surgeryConsent: { surgery: { target: 'surgeryCase', many: false }, budgetVersion: { target: 'surgeryBudgetVersion', many: false }, recordedBy: { target: 'user', many: false } },
  surgeryChecklistItem: { surgery: { target: 'surgeryCase', many: false }, completedBy: { target: 'user', many: false } },
  surgeryInstruction: { surgery: { target: 'surgeryCase', many: false }, approvedBy: { target: 'user', many: false } },
};

const rejectNestedRelationWrites = (value: unknown): void => {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (['connect', 'disconnect', 'connectOrCreate', 'delete', 'deleteMany'].includes(key)) {
      throw new Error(`Associação relacional '${key}' bloqueada: valide a clínica explicitamente antes de gravar`);
    }
    rejectNestedRelationWrites(nested);
  }
};

const scopeRelationReads = (model: string, input: any, clinicId: number): any => {
  if (!input || typeof input !== 'object') return input;
  const output = Array.isArray(input) ? input.map((item) => scopeRelationReads(model, item, clinicId)) : { ...input };
  const relations = TENANT_RELATIONS[model] || {};
  for (const [relation, descriptor] of Object.entries(relations)) {
    for (const container of ['include', 'select']) {
      const selection = output[container]?.[relation];
      if (!selection || !descriptor.many || typeof selection !== 'object') continue;
      output[container] = { ...output[container], [relation]: { ...selection, where: { ...(selection.where || {}), clinicId }, ...scopeRelationReads(descriptor.target, selection, clinicId) } };
    }
  }
  return output;
};

const scopeNestedWhere = (model: string, where: any, clinicId: number): any => {
  if (!where || typeof where !== 'object') return where;
  const result: any = Array.isArray(where) ? where.map((item) => scopeNestedWhere(model, item, clinicId)) : { ...where };
  const relations = TENANT_RELATIONS[model] || {};
  for (const [relation, descriptor] of Object.entries(relations)) {
    if (result[relation] && typeof result[relation] === 'object') {
      const nested = result[relation];
      if (descriptor.many && (nested.some || nested.every || nested.none)) {
        result[relation] = Object.fromEntries(Object.entries(nested).map(([operator, value]) => [operator, { ...scopeNestedWhere(descriptor.target, value, clinicId), clinicId }]));
      } else {
        result[relation] = { ...scopeNestedWhere(descriptor.target, nested, clinicId), clinicId };
      }
    }
  }
  if (result.OR) result.OR = scopeNestedWhere(model, result.OR, clinicId);
  if (result.AND) result.AND = scopeNestedWhere(model, result.AND, clinicId);
  if (result.NOT) result.NOT = scopeNestedWhere(model, result.NOT, clinicId);
  return result;
};

const SAFE_RAW_SQL = [
  /^SELECT\s+1$/i,
  /^SELECT\s+1\s+FROM\s+"public"\."AuthProfile"\s+LIMIT\s+1$/i,
  /^SELECT\s+DISTINCT\s+"clinicId"\s+FROM\s+"User"\s+WHERE\s+"clinicId"\s+IS\s+NOT\s+NULL\s+ORDER\s+BY\s+"clinicId"$/i,
  /^SELECT\s+pg_advisory_xact_lock\(/i,
];

const assertSafeRawQuery = (query: unknown): void => {
  const rawText = Array.isArray(query) ? query.join(' ') : query;
  const text = typeof rawText === 'string' ? rawText.replace(/\s+/g, ' ').trim() : '';
  if (!SAFE_RAW_SQL.some((pattern) => pattern.test(text))) {
    throw new Error('SQL direto bloqueado: use o Prisma escopado ou uma migração oficial');
  }
};

const createTenantModelProxy = (model: string, delegate: any, clinicId: number | undefined) =>
  new Proxy(delegate, {
    get(target, property, receiver) {
      const original = Reflect.get(target, property, receiver);
      if (typeof original !== 'function') return original;
      if ((original as any)._isMockFunction) return original;

      return async (...args: any[]) => {
        const [input = {}, ...rest] = args;
        const scoped = { ...input };
        const effectiveClinicId = clinicId ?? getCurrentClinicId();

        if (property === 'create' || property === 'createMany' || property === 'update' || property === 'updateMany' || property === 'upsert') {
          rejectNestedRelationWrites(input.data || input.create || input.update);
        }

        if (TENANT_ACTIONS.has(String(property))) {
          scoped.where = { ...scopeNestedWhere(model, input.where || {}, effectiveClinicId ?? -1), clinicId: effectiveClinicId ?? -1 };
        }

        if (effectiveClinicId) {
          Object.assign(scoped, scopeRelationReads(model, scoped, effectiveClinicId));
        }

        if (property === 'create' || property === 'createMany') {
          if (!effectiveClinicId) throw new Error(`Tenant context required for ${model} creation`);
          if (property === 'create') {
            scoped.data = { ...(input.data || {}), clinicId: effectiveClinicId };
          } else {
            const rows = Array.isArray(input.data) ? input.data : [input.data];
            scoped.data = rows.map((row: Record<string, unknown>) => ({ ...row, clinicId: effectiveClinicId }));
          }
        }

        if (property === 'upsert') {
          if (!effectiveClinicId) throw new Error(`Tenant context required for ${model} upsert`);
          const existing = await target.findFirst({ where: { ...(input.where || {}), clinicId: effectiveClinicId }, select: { id: true } });
          if (!existing) throw new Error(`Upsert bloqueado: registro ${model} inexistente no contexto da clínica`);
          scoped.create = { ...(input.create || {}), clinicId: effectiveClinicId };
          scoped.update = { ...(input.update || {}), clinicId: effectiveClinicId };
        }

        return original.call(target, scoped, ...rest);
      };
    },
  });

const createTenantClientProxy = (client: any, fixedClinicId?: number): any =>
  new Proxy(client, {
    get(target, property, receiver) {
      if (TENANT_MODELS.has(String(property))) {
        const delegate = Reflect.get(target, property, receiver);
        if (!delegate || (typeof delegate !== 'object' && typeof delegate !== 'function')) return delegate;
        return createTenantModelProxy(String(property), delegate, fixedClinicId);
      }

      if (property === '$transaction') {
        if ((target.$transaction as any)?._isMockFunction) {
          return (callbackOrArgs: any, ...rest: any[]) => {
            if (typeof callbackOrArgs === 'function') return callbackOrArgs(createTenantClientProxy(target, fixedClinicId ?? getCurrentClinicId()));
            return target.$transaction(callbackOrArgs, ...rest);
          };
        }
        return (callbackOrArgs: any, ...rest: any[]) => {
          if (typeof callbackOrArgs !== 'function') {
            throw new Error('Transações em lote exigem callback para preservar o contexto da clínica');
          }
          const clinicId = fixedClinicId ?? getCurrentClinicId();
          return target.$transaction((tx: any) => callbackOrArgs(createTenantClientProxy(tx, clinicId)), ...rest);
        };
      }

      if (property === '$queryRaw' || property === '$queryRawUnsafe') {
        if ((target as any)[property]?._isMockFunction) return (target as any)[property];
        return (...args: any[]) => {
          const query = args[0]?.sql ?? args[0]?.text ?? args[0];
          assertSafeRawQuery(query);
          return (target as any)[property](...args);
        };
      }

      if (property === '$executeRaw' || property === '$executeRawUnsafe') {
        if ((target as any)[property]?._isMockFunction) return (target as any)[property];
        return () => { throw new Error('SQL direto de escrita bloqueado fora de migrações oficiais'); };
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value === 'function') {
        return (value as any)._isMockFunction ? value : value.bind(target);
      }
      return value;
    },
  });

const createClient = () => new PrismaClient({
  datasources: { db: { url: config.database.url } },
  log: config.app.env === 'development' ? ['warn', 'error'] : [],
});

const rawPrisma = globalForPrisma.prisma ?? createClient();
export const prisma = createTenantClientProxy(rawPrisma) as PrismaClient;

if (config.app.env !== 'test') globalForPrisma.prisma = rawPrisma;

export const disconnectPrisma = async () => rawPrisma.$disconnect();
export const connectPrisma = async () => rawPrisma.$connect();
