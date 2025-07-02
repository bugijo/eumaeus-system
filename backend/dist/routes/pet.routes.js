"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petRoutes = void 0;
const express_1 = require("express");
const pet_controller_1 = require("../controllers/pet.controller");
const petRoutes = (0, express_1.Router)();
exports.petRoutes = petRoutes;
petRoutes.get('/pets', pet_controller_1.PetController.getAllPets);
petRoutes.get('/pets/:id', pet_controller_1.PetController.getPetById);
petRoutes.post('/pets', pet_controller_1.PetController.createPet);
petRoutes.put('/pets/:id', pet_controller_1.PetController.updatePet);
petRoutes.delete('/pets/:id', pet_controller_1.PetController.deletePet);
//# sourceMappingURL=pet.routes.js.map