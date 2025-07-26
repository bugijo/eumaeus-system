import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from '../useFormValidation';

// Schema de teste
const testSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Idade deve ser pelo menos 18'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('useFormValidation', () => {
  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    expect(result.current.values).toEqual({ name: '', email: '', age: 0 });
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('deve atualizar valores corretamente', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.setValue('name', 'João');
    });

    expect(result.current.values.name).toBe('João');
    expect(result.current.touched.name).toBe(true);
  });

  it('deve validar campos individuais', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.setValue('email', 'email-inválido');
    });

    expect(result.current.errors.email).toBe('Email inválido');
  });

  it('deve validar todo o formulário', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.validateAll();
    });

    expect(result.current.errors.name).toBe('Nome deve ter pelo menos 2 caracteres');
    expect(result.current.errors.email).toBe('Email inválido');
    expect(result.current.errors.age).toBe('Idade deve ser pelo menos 18');
  });

  it('deve marcar formulário como válido quando todos os campos são válidos', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: 'João Silva', email: 'joao@email.com', age: 25 },
      })
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('deve executar validação customizada', () => {
    const customValidation = jest.fn().mockReturnValue({ name: 'Nome já existe' });
    
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: 'João', email: 'joao@email.com', age: 25 },
        customValidation,
      })
    );

    act(() => {
      result.current.validateAll();
    });

    expect(customValidation).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      age: 25,
    });
    expect(result.current.errors.name).toBe('Nome já existe');
  });

  it('deve executar onSubmit quando formulário é válido', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: 'João Silva', email: 'joao@email.com', age: 25 },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'João Silva',
      email: 'joao@email.com',
      age: 25,
    });
  });

  it('não deve executar onSubmit quando formulário é inválido', async () => {
    const onSubmit = jest.fn();
    
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors).not.toEqual({});
  });

  it('deve gerenciar estado de submissão', async () => {
    const onSubmit = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: 'João Silva', email: 'joao@email.com', age: 25 },
        onSubmit,
      })
    );

    expect(result.current.isSubmitting).toBe(false);

    const submitPromise = act(async () => {
      return result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(true);

    await submitPromise;

    expect(result.current.isSubmitting).toBe(false);
  });

  it('deve resetar formulário', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.setValue('name', 'João');
      result.current.setValue('email', 'joao@email.com');
    });

    expect(result.current.values.name).toBe('João');
    expect(result.current.touched.name).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual({ name: '', email: '', age: 0 });
    expect(result.current.touched).toEqual({});
    expect(result.current.errors).toEqual({});
  });

  it('deve resetar com novos valores', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    const newValues = { name: 'Maria', email: 'maria@email.com', age: 30 };

    act(() => {
      result.current.reset(newValues);
    });

    expect(result.current.values).toEqual(newValues);
  });

  it('deve limpar erros', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.validateAll();
    });

    expect(result.current.errors).not.toEqual({});

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it('deve limpar erro de campo específico', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: '', email: '', age: 0 },
      })
    );

    act(() => {
      result.current.validateAll();
    });

    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.email).toBeDefined();

    act(() => {
      result.current.clearFieldError('name');
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.errors.email).toBeDefined();
  });

  it('deve validar email corretamente', () => {
    const { result } = renderHook(() => 
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues: { name: 'João', email: '', age: 25 },
      })
    );

    // Email inválido
    act(() => {
      result.current.setValue('email', 'email-inválido');
    });
    expect(result.current.errors.email).toBe('Email inválido');

    // Email válido
    act(() => {
      result.current.setValue('email', 'joao@email.com');
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it('deve validar CPF usando validação customizada', () => {
    const schemaWithCpf = z.object({
      cpf: z.string().min(1, 'CPF é obrigatório'),
    });

    const customValidation = (values: { cpf: string }) => {
      const errors: Record<string, string> = {};
      if (values.cpf && !values.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
        errors.cpf = 'CPF deve estar no formato 000.000.000-00';
      }
      return errors;
    };

    const { result } = renderHook(() => 
      useFormValidation({
        schema: schemaWithCpf,
        initialValues: { cpf: '' },
        customValidation,
      })
    );

    act(() => {
      result.current.setValue('cpf', '12345678901');
    });

    expect(result.current.errors.cpf).toBe('CPF deve estar no formato 000.000.000-00');

    act(() => {
      result.current.setValue('cpf', '123.456.789-01');
    });

    expect(result.current.errors.cpf).toBeUndefined();
  });
});