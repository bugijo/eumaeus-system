export interface ServiceType {
  id: number;
  name: string;
  description?: string;
  duration: number; // duração em minutos
  price: number;
  category: string; // ex: "Consulta", "Vacina", "Cirurgia", "Exame"
  active: boolean;
}

export interface ServiceCategory {
  name: string;
  services: ServiceType[];
}