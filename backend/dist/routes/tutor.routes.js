"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorRoutes = void 0;
const express_1 = require("express");
const tutor_controller_1 = require("../controllers/tutor.controller");
const pet_routes_1 = require("./pet.routes");
const tutorRoutes = (0, express_1.Router)();
exports.tutorRoutes = tutorRoutes;
tutorRoutes.get('/tutors', tutor_controller_1.TutorController.getAllTutors);
tutorRoutes.get('/tutors/:id', tutor_controller_1.TutorController.getTutorById);
tutorRoutes.post('/tutors', tutor_controller_1.TutorController.createTutor);
tutorRoutes.put('/tutors/:id', tutor_controller_1.TutorController.updateTutor);
tutorRoutes.delete('/tutors/:id', tutor_controller_1.TutorController.deleteTutor);
tutorRoutes.use('/tutors/:tutorId/pets', pet_routes_1.tutorPetRoutes);
//# sourceMappingURL=tutor.routes.js.map