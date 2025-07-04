describe('Teste Backend Simples', () => {
  it('deve conseguir conectar com o backend', () => {
    // Testar se o backend está respondendo
    cy.request({
      method: 'GET',
      url: 'http://localhost:3333/api/tutors',
      timeout: 10000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
    });
  });

  it('deve conseguir criar um tutor básico', () => {
    const tutorData = {
      nome: 'Teste Backend',
      email: `teste.${Date.now()}@email.com`,
      telefone: '(11) 99999-9999',
      endereco: 'Rua de Teste, 123'
    };

    cy.request({
      method: 'POST',
      url: 'http://localhost:3333/api/tutors',
      body: tutorData,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
      expect(response.body).to.have.property('id');
      expect(response.body.nome).to.eq(tutorData.nome);
    });
  });

  it('deve conseguir listar tutores', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:3333/api/tutors'
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      // Deve ter pelo menos um tutor (o que criamos no teste anterior)
      expect(response.body.length).to.be.greaterThan(0);
    });
  });
});