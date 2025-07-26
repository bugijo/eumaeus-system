import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

type ValidationRule<T> = {
  validator: (value: T) => boolean;
  message: string;
};

type FieldValidation<T> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
  zodSchema?: z.ZodSchema<T>;
};

type FormValidationConfig<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidation<T[K]>;
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

type ValidationState<T> = {
  errors: ValidationErrors<T>;
  isValid: boolean;
  isValidating: boolean;
  touchedFields: Set<keyof T>;
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationConfig: FormValidationConfig<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [validationState, setValidationState] = useState<ValidationState<T>>({
    errors: {},
    isValid: true,
    isValidating: false,
    touchedFields: new Set(),
  });

  // Validar um campo específico
  const validateField = useCallback(
    (fieldName: keyof T, value: any): string | undefined => {
      const fieldConfig = validationConfig[fieldName];
      if (!fieldConfig) return undefined;

      // Verificar se é obrigatório
      if (fieldConfig.required && (!value || value === '')) {
        return `${String(fieldName)} é obrigatório`;
      }

      // Validação com Zod Schema
      if (fieldConfig.zodSchema) {
        try {
          fieldConfig.zodSchema.parse(value);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return error.errors[0]?.message || 'Valor inválido';
          }
        }
      }

      // Validações customizadas
      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          if (!rule.validator(value)) {
            return rule.message;
          }
        }
      }

      return undefined;
    },
    [validationConfig]
  );

  // Validar todos os campos
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors<T> = {};
    let hasErrors = false;

    Object.keys(validationConfig).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      if (error) {
        newErrors[fieldName as keyof T] = error;
        hasErrors = true;
      }
    });

    setValidationState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: !hasErrors,
    }));

    return !hasErrors;
  }, [values, validateField, validationConfig]);

  // Atualizar valor de um campo
  const setValue = useCallback(
    (fieldName: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [fieldName]: value }));
      
      // Marcar campo como tocado
      setValidationState(prev => ({
        ...prev,
        touchedFields: new Set([...prev.touchedFields, fieldName]),
      }));

      // Validar campo em tempo real se já foi tocado
      const error = validateField(fieldName, value);
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: error,
        },
      }));
    },
    [validateField]
  );

  // Atualizar múltiplos valores
  const setValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Resetar formulário
  const reset = useCallback(() => {
    setValues(initialValues);
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
    });
  }, [initialValues]);

  // Marcar campo como tocado
  const touchField = useCallback((fieldName: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName]),
    }));
  }, []);

  // Verificar se campo foi tocado
  const isFieldTouched = useCallback(
    (fieldName: keyof T): boolean => {
      return validationState.touchedFields.has(fieldName);
    },
    [validationState.touchedFields]
  );

  // Obter erro de um campo específico
  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      return validationState.errors[fieldName];
    },
    [validationState.errors]
  );

  // Verificar se um campo tem erro
  const hasFieldError = useCallback(
    (fieldName: keyof T): boolean => {
      return Boolean(validationState.errors[fieldName]);
    },
    [validationState.errors]
  );

  // Props para input (facilita integração)
  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(fieldName, e.target.value);
      },
      onBlur: () => touchField(fieldName),
      error: isFieldTouched(fieldName) ? getFieldError(fieldName) : undefined,
      hasError: isFieldTouched(fieldName) && hasFieldError(fieldName),
    }),
    [values, setValue, touchField, isFieldTouched, getFieldError, hasFieldError]
  );

  // Estado computado
  const computedState = useMemo(() => ({
    hasErrors: Object.keys(validationState.errors).length > 0,
    touchedFieldsCount: validationState.touchedFields.size,
    totalFields: Object.keys(validationConfig).length,
  }), [validationState.errors, validationState.touchedFields, validationConfig]);

  return {
    // Valores
    values,
    setValue,
    setValues,
    
    // Validação
    errors: validationState.errors,
    isValid: validationState.isValid,
    isValidating: validationState.isValidating,
    validateField,
    validateAll,
    
    // Estado dos campos
    touchedFields: validationState.touchedFields,
    touchField,
    isFieldTouched,
    
    // Helpers para campos
    getFieldError,
    hasFieldError,
    getFieldProps,
    
    // Controle
    reset,
    
    // Estado computado
    ...computedState,
  };
}

// Hook especializado para validação com Zod
export function useZodValidation<T extends Record<string, any>>(
  initialValues: T,
  zodSchema: z.ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback(
    (valuesToValidate: T = values): boolean => {
      try {
        zodSchema.parse(valuesToValidate);
        setErrors({});
        setIsValid(true);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: ValidationErrors<T> = {};
          error.errors.forEach((err) => {
            if (err.path.length > 0) {
              const fieldName = err.path[0] as keyof T;
              newErrors[fieldName] = err.message;
            }
          });
          setErrors(newErrors);
          setIsValid(false);
          return false;
        }
        return false;
      }
    },
    [values, zodSchema]
  );

  const setValue = useCallback(
    (fieldName: keyof T, value: any) => {
      const newValues = { ...values, [fieldName]: value };
      setValues(newValues);
      
      // Validação em tempo real
      validate(newValues);
    },
    [values, validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValid(true);
  }, [initialValues]);

  return {
    values,
    setValue,
    setValues,
    errors,
    isValid,
    validate,
    reset,
  };
}

// Validadores comuns reutilizáveis
export const commonValidators = {
  email: {
    validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Email inválido',
  },
  phone: {
    validator: (value: string) => /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(value),
    message: 'Telefone inválido',
  },
  cpf: {
    validator: (value: string) => {
      const cpf = value.replace(/\D/g, '');
      return cpf.length === 11 && !/^(\d)\1{10}$/.test(cpf);
    },
    message: 'CPF inválido',
  },
  minLength: (min: number) => ({
    validator: (value: string) => value.length >= min,
    message: `Deve ter pelo menos ${min} caracteres`,
  }),
  maxLength: (max: number) => ({
    validator: (value: string) => value.length <= max,
    message: `Deve ter no máximo ${max} caracteres`,
  }),
  positiveNumber: {
    validator: (value: number) => value > 0,
    message: 'Deve ser um número positivo',
  },
};