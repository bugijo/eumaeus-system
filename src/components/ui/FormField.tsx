import React from 'react';
import type { FormFieldProps } from '../../types';

interface FormFieldComponentProps extends FormFieldProps {
  className?: string;
  description?: string;
}

export function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '',
  description 
}: FormFieldComponentProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg 
            className="w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Componente de Input com FormField integrado
interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(({ 
  label, 
  error, 
  required, 
  description, 
  className = '',
  ...inputProps 
}, ref) => {
  const inputClassName = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:border-blue-500 sm:text-sm
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${inputProps.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
  `.trim();

  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      description={description}
      className={className}
    >
      <input 
        {...inputProps}
        ref={ref}
        className={inputClassName}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputProps.id}-error` : undefined}
      />
    </FormField>
  );
});

InputField.displayName = 'InputField';

// Componente de Textarea com FormField integrado
interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({ 
  label, 
  error, 
  required, 
  description, 
  className = '',
  ...textareaProps 
}, ref) => {
  const textareaClassName = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:border-blue-500 sm:text-sm resize-vertical
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${textareaProps.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
  `.trim();

  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      description={description}
      className={className}
    >
      <textarea 
        {...textareaProps}
        ref={ref}
        className={textareaClassName}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaProps.id}-error` : undefined}
      />
    </FormField>
  );
});

TextareaField.displayName = 'TextareaField';

// Componente de Select com FormField integrado
interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(({ 
  label, 
  error, 
  required, 
  description, 
  className = '',
  options,
  placeholder = 'Selecione uma opção',
  ...selectProps 
}, ref) => {
  const selectClassName = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    sm:text-sm bg-white
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${selectProps.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
  `.trim();

  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      description={description}
      className={className}
    >
      <select 
        {...selectProps}
        ref={ref}
        className={selectClassName}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectProps.id}-error` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
});

SelectField.displayName = 'SelectField';