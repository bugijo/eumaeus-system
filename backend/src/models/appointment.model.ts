export interface Appointment {
  id: number;
  petId: number;
  tutorId: number;
  date: string; // formato "YYYY-MM-DD"
  time: string; // formato "HH:mm"
  serviceType: string; // ex: "Consulta", "Vacina", "Cirurgia"
  status: string; // ex: "Agendado", "Confirmado", "Cancelado"
}