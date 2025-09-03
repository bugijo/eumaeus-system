// Web Worker para processamento pesado de dados
// Evita bloquear a UI principal durante operações intensivas

class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
  }

  // Processar dados de agendamentos
  processAppointments(appointments) {
    const startTime = performance.now();
    
    try {
      // Agrupar por status
      const byStatus = appointments.reduce((acc, appointment) => {
        const status = appointment.status || 'UNKNOWN';
        if (!acc[status]) acc[status] = [];
        acc[status].push(appointment);
        return acc;
      }, {});

      // Agrupar por data
      const byDate = appointments.reduce((acc, appointment) => {
        const date = new Date(appointment.appointmentDate).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(appointment);
        return acc;
      }, {});

      // Calcular estatísticas
      const stats = {
        total: appointments.length,
        byStatus: Object.keys(byStatus).map(status => ({
          status,
          count: byStatus[status].length,
          percentage: ((byStatus[status].length / appointments.length) * 100).toFixed(1)
        })),
        byDate: Object.keys(byDate).map(date => ({
          date,
          count: byDate[date].length
        })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        processingTime: performance.now() - startTime
      };

      return {
        success: true,
        data: {
          byStatus,
          byDate,
          stats,
          processed: appointments
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: performance.now() - startTime
      };
    }
  }

  // Processar dados de pets
  processPets(pets) {
    const startTime = performance.now();
    
    try {
      // Agrupar por espécie
      const bySpecies = pets.reduce((acc, pet) => {
        const species = pet.species || 'Não informado';
        if (!acc[species]) acc[species] = [];
        acc[species].push(pet);
        return acc;
      }, {});

      // Agrupar por idade
      const byAge = pets.reduce((acc, pet) => {
        let ageGroup;
        const age = pet.age || 0;
        
        if (age < 1) ageGroup = 'Filhote (< 1 ano)';
        else if (age <= 3) ageGroup = 'Jovem (1-3 anos)';
        else if (age <= 7) ageGroup = 'Adulto (4-7 anos)';
        else ageGroup = 'Idoso (> 7 anos)';
        
        if (!acc[ageGroup]) acc[ageGroup] = [];
        acc[ageGroup].push(pet);
        return acc;
      }, {});

      // Calcular estatísticas
      const stats = {
        total: pets.length,
        bySpecies: Object.keys(bySpecies).map(species => ({
          species,
          count: bySpecies[species].length,
          percentage: ((bySpecies[species].length / pets.length) * 100).toFixed(1)
        })),
        byAge: Object.keys(byAge).map(ageGroup => ({
          ageGroup,
          count: byAge[ageGroup].length,
          percentage: ((byAge[ageGroup].length / pets.length) * 100).toFixed(1)
        })),
        averageAge: pets.reduce((sum, pet) => sum + (pet.age || 0), 0) / pets.length,
        processingTime: performance.now() - startTime
      };

      return {
        success: true,
        data: {
          bySpecies,
          byAge,
          stats,
          processed: pets
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: performance.now() - startTime
      };
    }
  }

  // Processar dados financeiros
  processFinancialData(invoices) {
    const startTime = performance.now();
    
    try {
      // Agrupar por mês
      const byMonth = invoices.reduce((acc, invoice) => {
        const date = new Date(invoice.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            invoices: [],
            total: 0,
            count: 0
          };
        }
        
        acc[monthKey].invoices.push(invoice);
        acc[monthKey].total += invoice.total || 0;
        acc[monthKey].count++;
        
        return acc;
      }, {});

      // Calcular tendências
      const monthlyData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
      const trends = monthlyData.map((month, index) => {
        const prevMonth = monthlyData[index - 1];
        const growth = prevMonth ? 
          ((month.total - prevMonth.total) / prevMonth.total * 100).toFixed(1) : 0;
        
        return {
          ...month,
          growth: parseFloat(growth)
        };
      });

      // Estatísticas gerais
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      const averageInvoice = totalRevenue / invoices.length;
      
      const stats = {
        totalRevenue,
        averageInvoice,
        totalInvoices: invoices.length,
        monthlyData: trends,
        processingTime: performance.now() - startTime
      };

      return {
        success: true,
        data: {
          byMonth,
          trends,
          stats,
          processed: invoices
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: performance.now() - startTime
      };
    }
  }

  // Busca e filtro avançado
  advancedSearch(data, searchTerm, filters = {}) {
    const startTime = performance.now();
    
    try {
      let results = [...data];
      
      // Aplicar filtros
      Object.keys(filters).forEach(key => {
        const filterValue = filters[key];
        if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
          results = results.filter(item => {
            const itemValue = item[key];
            if (typeof filterValue === 'string') {
              return itemValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
            }
            return itemValue === filterValue;
          });
        }
      });
      
      // Aplicar busca textual
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        results = results.filter(item => {
          return Object.values(item).some(value => 
            value?.toString().toLowerCase().includes(term)
          );
        });
      }
      
      return {
        success: true,
        data: {
          results,
          totalFound: results.length,
          searchTerm,
          filters,
          processingTime: performance.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: performance.now() - startTime
      };
    }
  }

  // Processar fila de tarefas
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const task = this.processingQueue.shift();
      const result = await this.executeTask(task);
      
      // Enviar resultado de volta
      self.postMessage({
        type: 'TASK_COMPLETE',
        taskId: task.id,
        result
      });
      
      // Pequena pausa para não bloquear
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    this.isProcessing = false;
  }

  executeTask(task) {
    switch (task.type) {
      case 'PROCESS_APPOINTMENTS':
        return this.processAppointments(task.data);
      case 'PROCESS_PETS':
        return this.processPets(task.data);
      case 'PROCESS_FINANCIAL':
        return this.processFinancialData(task.data);
      case 'ADVANCED_SEARCH':
        return this.advancedSearch(task.data, task.searchTerm, task.filters);
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`
        };
    }
  }
}

// Instância do processador
const processor = new DataProcessor();

// Listener para mensagens do thread principal
self.addEventListener('message', async (event) => {
  const { type, data, taskId } = event.data;
  
  switch (type) {
    case 'QUEUE_TASK':
      processor.processingQueue.push({ ...data, id: taskId });
      processor.processQueue();
      break;
      
    case 'CLEAR_CACHE':
      processor.cache.clear();
      self.postMessage({
        type: 'CACHE_CLEARED',
        taskId
      });
      break;
      
    case 'GET_STATS':
      self.postMessage({
        type: 'WORKER_STATS',
        taskId,
        data: {
          cacheSize: processor.cache.size,
          queueLength: processor.processingQueue.length,
          isProcessing: processor.isProcessing
        }
      });
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        taskId,
        error: `Unknown message type: ${type}`
      });
  }
});

// Notificar que o worker está pronto
self.postMessage({
  type: 'WORKER_READY',
  timestamp: Date.now()
});