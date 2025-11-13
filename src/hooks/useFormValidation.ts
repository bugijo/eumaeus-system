import { useState, useCallback, useRef } from 'react';
import { z } from 'zod';

type FormErrors<T> = Partial<Record<keyof T, string>>;
type TouchedState<T> = Partial<Record<keyof T, boolean>>;

type CustomValidation<T> = (values: T) => Partial<Record<keyof T, string>>;

type UseFormValidationParams<T extends Record<string, any>> = {
  schema: z.ZodSchema<T>;
  initialValues: T;
  customValidation?: CustomValidation<T>;
  onSubmit?: (values: T) => void | Promise<void>;
};

type UseFormValidationReturn<T extends Record<string, any>> = {
  values: T;
  errors: FormErrors<T>;
  touched: TouchedState<T>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (nextValues: Partial<T>) => void;
  validateField: (field: keyof T) => string | undefined;
  validateAll: () => boolean;
  handleSubmit: () => Promise<void>;
  reset: (nextValues?: T) => void;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
};

const mapSchemaErrors = <T extends Record<string, any>>(issues: z.ZodIssue[]): FormErrors<T> => {
  return issues.reduce<FormErrors<T>>((acc, issue) => {
    const [path] = issue.path;
    if (typeof path !== 'undefined') {
      acc[path as keyof T] = issue.message;
    }
    return acc;
  }, {});
};

const runAllValidations = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  values: T,
  customValidation?: CustomValidation<T>
) => {
  const schemaResult = schema.safeParse(values);
  const schemaErrors = schemaResult.success ? {} : mapSchemaErrors<T>(schemaResult.error.issues);

  const customErrors = customValidation ? customValidation(values) : {};

  const mergedErrors: FormErrors<T> = { ...schemaErrors };
  (Object.keys(customErrors) as Array<keyof T>).forEach((key) => {
    const message = customErrors[key];
    if (message) {
      mergedErrors[key] = message;
    } else {
      delete mergedErrors[key];
    }
  });

  return {
    errors: mergedErrors,
    isValid: Object.keys(mergedErrors).length === 0,
  };
};

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  customValidation,
  onSubmit,
}: UseFormValidationParams<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<TouchedState<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiRef = useRef<UseFormValidationReturn<T> | null>(null);
  const [isValid, setIsValid] = useState(() =>
    runAllValidations(schema, initialValues, customValidation).isValid
  );

  const validateValues = useCallback(
    (valuesToValidate: T) => runAllValidations(schema, valuesToValidate, customValidation),
    [schema, customValidation]
  );

  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValuesState((prevValues) => {
        const nextValues = { ...prevValues, [field]: value } as T;
        const { errors: nextErrors, isValid: nextIsValid } = validateValues(nextValues);
        setErrors(nextErrors);
        setIsValid(nextIsValid);
        return nextValues;
      });

      setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
    },
    [validateValues]
  );

  const setValues = useCallback(
    (nextValues: Partial<T>) => {
      setValuesState((prevValues) => {
        const mergedValues = { ...prevValues, ...nextValues } as T;
        const { errors: nextErrors, isValid: nextIsValid } = validateValues(mergedValues);
        setErrors(nextErrors);
        setIsValid(nextIsValid);
        return mergedValues;
      });

      setTouched((prevTouched) => {
        const updatedTouched: TouchedState<T> = { ...prevTouched };
        (Object.keys(nextValues) as Array<keyof T>).forEach((key) => {
          updatedTouched[key] = true;
        });
        return updatedTouched;
      });
    },
    [validateValues]
  );

  const validateField = useCallback(
    (field: keyof T) => {
      const { errors: nextErrors, isValid: nextIsValid } = validateValues(values);
      setErrors(nextErrors);
      setIsValid(nextIsValid);
      setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
      return nextErrors[field];
    },
    [validateValues, values]
  );

  const validateAll = useCallback(() => {
    const { errors: nextErrors, isValid: nextIsValid } = validateValues(values);
    setErrors(nextErrors);
    setIsValid(nextIsValid);
    setTouched(() => {
      const nextTouched: TouchedState<T> = {};
      (Object.keys(values) as Array<keyof T>).forEach((key) => {
        nextTouched[key] = true;
      });
      return nextTouched;
    });
    return nextIsValid;
  }, [validateValues, values]);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    if (apiRef.current) {
      apiRef.current.isSubmitting = true;
    }

    const valid = validateAll();
    if (!valid || !onSubmit) {
      setIsSubmitting(false);
      if (apiRef.current) {
        apiRef.current.isSubmitting = false;
      }
      return Promise.resolve();
    }

    const submission = Promise.resolve(onSubmit(values));
    submission.finally(() => {
      setIsSubmitting(false);
      if (apiRef.current) {
        apiRef.current.isSubmitting = false;
      }
    });

    return submission;
  }, [validateAll, onSubmit, values]);

  const reset = useCallback(
    (nextValues?: T) => {
      const baseValues = nextValues ?? initialValues;
      setValuesState(baseValues);
      setErrors({});
      setTouched({});
      const { isValid: nextIsValid } = validateValues(baseValues);
      setIsValid(nextIsValid);
    },
    [initialValues, validateValues]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(validateValues(values).isValid);
  }, [validateValues, values]);

  const clearFieldError = useCallback(
    (field: keyof T) => {
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        delete nextErrors[field];
        return nextErrors;
      });
      setIsValid(validateValues(values).isValid);
    },
    [validateValues, values]
  );

  const api: UseFormValidationReturn<T> = {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    clearErrors,
    clearFieldError,
  };

  apiRef.current = api;

  return api;
}

export function useZodValidation<T extends Record<string, any>>(
  initialValues: T,
  zodSchema: z.ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
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
          const schemaErrors = mapSchemaErrors<T>(error.issues);
          setErrors(schemaErrors);
          setIsValid(false);
        }
        return false;
      }
    },
    [values, zodSchema]
  );

  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      const nextValues = { ...values, [field]: value } as T;
      setValues(nextValues);
      validate(nextValues);
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
