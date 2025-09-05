import React, { useState } from 'react';
import { useFormTracking, useInteractionTracking } from '../../hooks/use-telemetry-hooks';

interface TrackedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  trackingData?: Record<string, any>;
}

export const TrackedButton: React.FC<TrackedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  trackingData = {},
}) => {
  const { trackClick, trackHover } = useInteractionTracking('TrackedButton');

  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleClick = () => {
    trackClick('button_click', { variant, size, ...trackingData });
    onClick?.();
  };

  const handleMouseEnter = () => {
    trackHover({ variant, size, ...trackingData });
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </button>
  );
};

interface TrackedFormProps {
  formName: string;
  onSubmit: (data: Record<string, any>) => void;
  children?: React.ReactNode;
  className?: string;
}

export const TrackedForm: React.FC<TrackedFormProps> = ({
  formName,
  onSubmit,
  children,
  className = '',
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const {
    trackFormStart,
    trackFieldFocus,
    trackFieldBlur,
    trackFormSubmit,
    trackFormAbandonment,
  } = useFormTracking(formName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit(formData);
      trackFormSubmit(true, [], formData);
    } catch (error: any) {
      const errorMessages = [error.message || 'Unknown error'];
      setErrors(errorMessages);
      trackFormSubmit(false, errorMessages, formData);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  React.useEffect(() => {
    trackFormStart();
    
    const handleBeforeUnload = () => {
      if (Object.keys(formData).length > 0) {
        trackFormAbandonment();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackFormStart, trackFormAbandonment, formData]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && 'name' in (child.props as any)) {
          // Type assertion to handle props safely
          const childElement = child as React.ReactElement<{
            name: string;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            onFocus?: () => void;
            onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
            [key: string]: any;
          }>;

          return React.cloneElement(childElement, {
            onFocus: () => trackFieldFocus(childElement.props.name),
            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
              trackFieldBlur(childElement.props.name, e.target.value);
            },
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChange(childElement.props.name, e.target.value);
              // Now TypeScript knows onChange exists and its type
              if (childElement.props.onChange) {
                childElement.props.onChange(e);
              }
            },
          });
        }
        return child;
      })}
      
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}
    </form>
  );
};

// components/TrackedInput.tsx
interface TrackedInputProps {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const TrackedInput: React.FC<TrackedInputProps> = ({
  name,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  onChange,
  onFocus,
  onBlur,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2 capitalize">
        {name.replace(/([A-Z])/g, ' $1').trim()}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-200 ${className}`}
      />
    </div>
  );
};