"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicSettingsRoutes = void 0;
const express_1 = require("express");
const clinicSettingsController_1 = __importDefault(require("../controllers/clinicSettingsController"));
const router = (0, express_1.Router)();
exports.clinicSettingsRoutes = router;
router.get('/notifications', clinicSettingsController_1.default.getSettings);
router.put('/notifications', clinicSettingsController_1.default.updateSettings);
router.post('/notifications/test', clinicSettingsController_1.default.testEmailSettings);
router.post('/notifications/reset', clinicSettingsController_1.default.resetToDefaults);
router.get('/notifications/stats', clinicSettingsController_1.default.getReminderStats);
router.get('/notifications/template-variables', clinicSettingsController_1.default.getTemplateVariables);
exports.default = router;
//# sourceMappingURL=clinicSettings.routes.js.map