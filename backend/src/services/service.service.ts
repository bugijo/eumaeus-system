import { ServiceType, ServiceCategory } from '../models/service.model';

export class ServiceService {
  // Dados mockados dos serviços (futuramente virão do banco de dados)
  private static readonly SERVICES: ServiceType[] = [
    // Consultas
    {
      id: 1,
      name: 'Consulta de Rotina',
      description: 'Consulta veterinária geral para check-up',
      duration: 30,
      price: 80.00,
      category: 'Consulta',
      active: true
    },
    {
      id: 2,
      name: 'Consulta de Retorno',
      description: 'Consulta de acompanhamento pós-tratamento',
      duration: 20,
      price: 50.00,
      category: 'Consulta',
      active: true
    },
    {
      id: 3,
      name: 'Consulta de Emergência',
      description: 'Atendimento urgente para casos emergenciais',
      duration: 45,
      price: 150.00,
      category: 'Consulta',
      active: true
    },
    
    // Vacinas
    {
      id: 4,
      name: 'Vacina V8',
      description: 'Vacina óctupla para cães',
      duration: 15,
      price: 60.00,
      category: 'Vacina',
      active: true
    },
    {
      id: 5,
      name: 'Vacina V10',
      description: 'Vacina déctupla para cães',
      duration: 15,
      price: 70.00,
      category: 'Vacina',
      active: true
    },
    {
      id: 6,
      name: 'Vacina Antirrábica',
      description: 'Vacina contra raiva',
      duration: 10,
      price: 40.00,
      category: 'Vacina',
      active: true
    },
    {
      id: 7,
      name: 'Vacina Tríplice Felina',
      description: 'Vacina tríplice para gatos',
      duration: 15,
      price: 65.00,
      category: 'Vacina',
      active: true
    },
    
    // Exames
    {
      id: 8,
      name: 'Raio-X',
      description: 'Exame radiográfico',
      duration: 30,
      price: 120.00,
      category: 'Exame',
      active: true
    },
    {
      id: 9,
      name: 'Ultrassom',
      description: 'Exame ultrassonográfico',
      duration: 45,
      price: 180.00,
      category: 'Exame',
      active: true
    },
    {
      id: 10,
      name: 'Exame de Sangue',
      description: 'Hemograma completo',
      duration: 15,
      price: 90.00,
      category: 'Exame',
      active: true
    },
    
    // Cirurgias
    {
      id: 11,
      name: 'Castração Macho',
      description: 'Cirurgia de castração para machos',
      duration: 60,
      price: 300.00,
      category: 'Cirurgia',
      active: true
    },
    {
      id: 12,
      name: 'Castração Fêmea',
      description: 'Cirurgia de castração para fêmeas',
      duration: 90,
      price: 400.00,
      category: 'Cirurgia',
      active: true
    },
    
    // Outros
    {
      id: 13,
      name: 'Banho e Tosa',
      description: 'Serviço de higiene e estética',
      duration: 60,
      price: 50.00,
      category: 'Estética',
      active: true
    },
    {
      id: 14,
      name: 'Limpeza Dentária',
      description: 'Profilaxia dental veterinária',
      duration: 45,
      price: 200.00,
      category: 'Odontologia',
      active: true
    }
  ];

  /**
   * Retorna todos os serviços ativos
   */
  static getAllServices(): ServiceType[] {
    return this.SERVICES.filter(service => service.active);
  }

  /**
   * Retorna serviços agrupados por categoria
   */
  static getServicesByCategory(): ServiceCategory[] {
    const activeServices = this.getAllServices();
    const categories = [...new Set(activeServices.map(service => service.category))];
    
    return categories.map(categoryName => ({
      name: categoryName,
      services: activeServices.filter(service => service.category === categoryName)
    }));
  }

  /**
   * Busca um serviço por ID
   */
  static getServiceById(id: number): ServiceType | null {
    const service = this.SERVICES.find(service => service.id === id && service.active);
    return service || null;
  }

  /**
   * Busca serviços por categoria específica
   */
  static getServicesByCategoryName(category: string): ServiceType[] {
    return this.SERVICES.filter(service => 
      service.category.toLowerCase() === category.toLowerCase() && service.active
    );
  }

  /**
   * Busca serviços por nome (busca parcial)
   */
  static searchServices(query: string): ServiceType[] {
    const searchTerm = query.toLowerCase();
    return this.SERVICES.filter(service => 
      service.active && (
        service.name.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm)
      )
    );
  }
}