"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDirectMedicalRecord = exports.getAvailableProducts = exports.getRecordByAppointment = exports.getRecordsByPet = exports.createMedicalRecord = void 0;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const createMedicalRecordSchema = zod_1.z.object({
    symptoms: zod_1.z.string().min(1, 'Sintomas são obrigatórios'),
    diagnosis: zod_1.z.string().min(1, 'Diagnóstico é obrigatório'),
    treatment: zod_1.z.string().min(1, 'Tratamento é obrigatório'),
    notes: zod_1.z.string().optional(),
    products: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.number(),
        quantityUsed: zod_1.z.number().min(1, 'Quantidade deve ser maior que 0')
    })).optional().default([])
});
const createDirectMedicalRecordSchema = zod_1.z.object({
    petId: zod_1.z.number().min(1, 'Pet ID é obrigatório'),
    weight: zod_1.z.number().optional(),
    temperature: zod_1.z.number().optional(),
    heartRate: zod_1.z.number().optional(),
    respiratoryRate: zod_1.z.number().optional(),
    symptoms: zod_1.z.string().min(1, 'Sintomas são obrigatórios'),
    diagnosis: zod_1.z.string().min(1, 'Diagnóstico é obrigatório'),
    treatment: zod_1.z.string().min(1, 'Tratamento é obrigatório'),
    notes: zod_1.z.string().optional(),
    usedProducts: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.number(),
        quantityUsed: zod_1.z.number().min(1, 'Quantidade deve ser maior que 0')
    })).optional().default([])
});
const createMedicalRecord = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const validatedData = createMedicalRecordSchema.parse(req.body);
        const appointment = await prisma_1.prisma.appointment.findUnique({
            where: { id: parseInt(appointmentId) },
            include: { medicalRecord: true }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        if (appointment.medicalRecord) {
            return res.status(400).json({ error: 'Este agendamento já possui um prontuário' });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const medicalRecord = await tx.medicalRecord.create({
                data: {
                    appointmentId: parseInt(appointmentId),
                    symptoms: validatedData.symptoms,
                    diagnosis: validatedData.diagnosis,
                    treatment: validatedData.treatment,
                    notes: validatedData.notes
                }
            });
            if (validatedData.products.length > 0) {
                for (const productData of validatedData.products) {
                    const product = await tx.product.findUnique({
                        where: { id: productData.productId }
                    });
                    if (!product) {
                        throw new Error(`Produto com ID ${productData.productId} não encontrado`);
                    }
                    if (product.quantity < productData.quantityUsed) {
                        throw new Error(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${productData.quantityUsed}`);
                    }
                }
                await tx.medicalRecordProduct.createMany({
                    data: validatedData.products.map(productData => ({
                        medicalRecordId: medicalRecord.id,
                        productId: productData.productId,
                        quantityUsed: productData.quantityUsed
                    }))
                });
                for (const productData of validatedData.products) {
                    await tx.product.update({
                        where: { id: productData.productId },
                        data: {
                            quantity: {
                                decrement: productData.quantityUsed
                            }
                        }
                    });
                }
            }
            await tx.appointment.update({
                where: { id: parseInt(appointmentId) },
                data: { status: 'COMPLETED' }
            });
            return medicalRecord;
        });
        const completeMedicalRecord = await prisma_1.prisma.medicalRecord.findUnique({
            where: { id: result.id },
            include: {
                appointment: {
                    include: {
                        pet: { include: { tutor: true } }
                    }
                },
                products: {
                    include: { product: true }
                }
            }
        });
        return res.status(201).json(completeMedicalRecord);
    }
    catch (error) {
        console.error('Erro ao criar prontuário:', error);
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => ({
                message: `${issue.path.join('.')}: ${issue.message}`
            }));
            return res.status(400).json({ error: 'Dados inválidos', details: errorMessages });
        }
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' });
    }
};
exports.createMedicalRecord = createMedicalRecord;
const getRecordsByPet = async (req, res) => {
    try {
        const { petId } = req.params;
        const records = await prisma_1.prisma.medicalRecord.findMany({
            where: {
                appointment: {
                    petId: parseInt(petId)
                }
            },
            include: {
                appointment: {
                    include: {
                        pet: { include: { tutor: true } }
                    }
                },
                products: {
                    include: { product: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.json(records);
    }
    catch (error) {
        console.error('Erro ao buscar prontuários do pet:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getRecordsByPet = getRecordsByPet;
const getRecordByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const record = await prisma_1.prisma.medicalRecord.findUnique({
            where: {
                appointmentId: parseInt(appointmentId)
            },
            include: {
                appointment: {
                    include: {
                        pet: { include: { tutor: true } }
                    }
                },
                products: {
                    include: { product: true }
                }
            }
        });
        if (!record) {
            return res.status(404).json({ error: 'Prontuário não encontrado' });
        }
        return res.json(record);
    }
    catch (error) {
        console.error('Erro ao buscar prontuário:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getRecordByAppointment = getRecordByAppointment;
const getAvailableProducts = async (req, res) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: {
                quantity: {
                    gt: 0
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.json(products);
    }
    catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getAvailableProducts = getAvailableProducts;
const createDirectMedicalRecord = async (req, res) => {
    try {
        const validatedData = createDirectMedicalRecordSchema.parse(req.body);
        const pet = await prisma_1.prisma.pet.findUnique({
            where: { id: validatedData.petId },
            include: { tutor: true }
        });
        if (!pet) {
            return res.status(404).json({ error: 'Pet não encontrado' });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.create({
                data: {
                    appointmentDate: new Date(),
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                    status: 'COMPLETED',
                    notes: 'Agendamento criado automaticamente para prontuário direto',
                    petId: validatedData.petId,
                    tutorId: pet.tutorId
                }
            });
            const medicalRecord = await tx.medicalRecord.create({
                data: {
                    appointmentId: appointment.id,
                    symptoms: validatedData.symptoms,
                    diagnosis: validatedData.diagnosis,
                    treatment: validatedData.treatment,
                    notes: validatedData.notes
                }
            });
            if (validatedData.usedProducts.length > 0) {
                for (const productData of validatedData.usedProducts) {
                    const product = await tx.product.findUnique({
                        where: { id: productData.productId }
                    });
                    if (!product) {
                        throw new Error(`Produto com ID ${productData.productId} não encontrado`);
                    }
                    if (product.quantity < productData.quantityUsed) {
                        throw new Error(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${productData.quantityUsed}`);
                    }
                }
                await tx.medicalRecordProduct.createMany({
                    data: validatedData.usedProducts.map(productData => ({
                        medicalRecordId: medicalRecord.id,
                        productId: productData.productId,
                        quantityUsed: productData.quantityUsed
                    }))
                });
                for (const productData of validatedData.usedProducts) {
                    await tx.product.update({
                        where: { id: productData.productId },
                        data: {
                            quantity: {
                                decrement: productData.quantityUsed
                            }
                        }
                    });
                }
            }
            return { medicalRecord, appointment };
        });
        const completeMedicalRecord = await prisma_1.prisma.medicalRecord.findUnique({
            where: { id: result.medicalRecord.id },
            include: {
                appointment: {
                    include: {
                        pet: { include: { tutor: true } }
                    }
                },
                products: {
                    include: { product: true }
                }
            }
        });
        return res.status(201).json(completeMedicalRecord);
    }
    catch (error) {
        console.error('Erro ao criar prontuário direto:', error);
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => ({
                message: `${issue.path.join('.')}: ${issue.message}`
            }));
            return res.status(400).json({ error: 'Dados inválidos', details: errorMessages });
        }
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' });
    }
};
exports.createDirectMedicalRecord = createDirectMedicalRecord;
//# sourceMappingURL=medicalRecordController.js.map