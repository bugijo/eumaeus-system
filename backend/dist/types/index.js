"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const appointmentWithRelations = client_1.Prisma.validator()({
    include: { pet: true, tutor: true },
});
const petWithRelations = client_1.Prisma.validator()({
    include: { tutor: true },
});
const medicalRecordWithRelations = client_1.Prisma.validator()({
    include: {
        appointment: {
            include: {
                pet: { include: { tutor: true } },
            },
        },
    },
});
const invoiceWithRelations = client_1.Prisma.validator()({
    include: {
        items: true,
        appointment: {
            include: {
                pet: {
                    include: {
                        tutor: true
                    }
                }
            }
        }
    },
});
const tutorWithRelations = client_1.Prisma.validator()({
    include: {
        pets: true,
        appointments: true
    },
});
//# sourceMappingURL=index.js.map