import { Prisma } from '@prisma/client';
declare const appointmentWithRelations: {
    include: {
        pet: true;
        tutor: true;
    };
};
export type AppointmentWithRelations = Prisma.AppointmentGetPayload<typeof appointmentWithRelations>;
declare const petWithRelations: {
    include: {
        tutor: true;
    };
};
export type PetWithRelations = Prisma.PetGetPayload<typeof petWithRelations>;
declare const medicalRecordWithRelations: {
    include: {
        appointment: {
            include: {
                pet: {
                    include: {
                        tutor: true;
                    };
                };
            };
        };
    };
};
export type MedicalRecordWithRelations = Prisma.MedicalRecordGetPayload<typeof medicalRecordWithRelations>;
declare const invoiceWithRelations: {
    include: {
        items: true;
        appointment: {
            include: {
                pet: {
                    include: {
                        tutor: true;
                    };
                };
            };
        };
    };
};
export type InvoiceWithRelations = Prisma.InvoiceGetPayload<typeof invoiceWithRelations>;
declare const tutorWithRelations: {
    include: {
        pets: true;
        appointments: true;
    };
};
export type TutorWithRelations = Prisma.TutorGetPayload<typeof tutorWithRelations>;
declare const invoiceWithFullRelations: {
    include: {
        items: true;
        appointment: {
            include: {
                pet: {
                    include: {
                        tutor: true;
                    };
                };
                tutor: true;
            };
        };
    };
};
export type InvoiceWithFullRelations = Prisma.InvoiceGetPayload<typeof invoiceWithFullRelations>;
export {};
//# sourceMappingURL=index.d.ts.map