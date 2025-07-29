"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const appointment_service_1 = require("./appointment.service");
class AvailabilityService {
    static getAvailability(request) {
        const { year, month, serviceType } = request;
        const settings = this.DEFAULT_CLINIC_SETTINGS;
        const allSlots = this.generateAllSlotsForMonth(year, month, settings);
        const existingAppointments = this.getAppointmentsForMonth(year, month);
        const availableSlots = this.markOccupiedSlots(allSlots, existingAppointments);
        return {
            year,
            month,
            availableSlots,
            workingHours: {
                start: settings.workingHours.start,
                end: settings.workingHours.end,
                slotDuration: settings.slotDuration
            }
        };
    }
    static generateAllSlotsForMonth(year, month, settings) {
        const slots = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            if (settings.workingDays.includes(dayOfWeek)) {
                const dateString = this.formatDate(date);
                const daySlots = this.generateSlotsForDay(dateString, settings);
                slots.push(...daySlots);
            }
        }
        return slots;
    }
    static generateSlotsForDay(date, settings) {
        const slots = [];
        const startTime = this.parseTime(settings.workingHours.start);
        const endTime = this.parseTime(settings.workingHours.end);
        const lunchStart = settings.lunchBreak ? this.parseTime(settings.lunchBreak.start) : null;
        const lunchEnd = settings.lunchBreak ? this.parseTime(settings.lunchBreak.end) : null;
        let currentTime = startTime;
        while (currentTime < endTime) {
            const timeString = this.formatTime(currentTime);
            const isLunchTime = lunchStart && lunchEnd &&
                currentTime >= lunchStart && currentTime < lunchEnd;
            if (!isLunchTime) {
                slots.push({
                    date,
                    time: timeString,
                    available: true
                });
            }
            currentTime += settings.slotDuration;
        }
        return slots;
    }
    static getAppointmentsForMonth(year, month) {
        const allAppointments = appointment_service_1.AppointmentService.getAllAppointments();
        return allAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate.getFullYear() === year &&
                appointmentDate.getMonth() === month - 1;
        });
    }
    static markOccupiedSlots(slots, appointments) {
        return slots.map(slot => {
            const isOccupied = appointments.some(appointment => appointment.date === slot.date && appointment.time === slot.time);
            return {
                ...slot,
                available: !isOccupied
            };
        });
    }
    static isSlotAvailable(date, time) {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const availability = this.getAvailability({ year, month });
        const slot = availability.availableSlots.find(s => s.date === date && s.time === time);
        return slot ? slot.available : false;
    }
    static parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    static formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    static formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
exports.AvailabilityService = AvailabilityService;
AvailabilityService.DEFAULT_CLINIC_SETTINGS = {
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHours: {
        start: '08:00',
        end: '18:00'
    },
    slotDuration: 30,
    lunchBreak: {
        start: '12:00',
        end: '13:00'
    }
};
//# sourceMappingURL=availability.service.js.map