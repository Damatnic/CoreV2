import React from 'react';
import { renderHook, act } from '../test-utils';
import { useMobileForm, createMobileFormValidator, commonValidationRules } from './useMobileForm';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useMobileForm Hook', () => {
  it('should initialize with empty form state', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    expect(result.current.formState.fields).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitCount).toBe(0);
  });

  it('should initialize with initial values', () => {
    const initialValues = { email: 'test@example.com', name: 'John Doe' };
    
    const { result } = renderHook(() => useMobileForm({ initialValues }), { wrapper: Wrapper });
    
    expect(result.current.formState.fields.email.value).toBe('test@example.com');
    expect(result.current.formState.fields.name.value).toBe('John Doe');
    expect(result.current.formState.fields.email.isValid).toBe(true);
    expect(result.current.formState.fields.email.isTouched).toBe(false);
  });

  it('should update field value', () => {
    const onFieldChange = jest.fn();
    const { result } = renderHook(() => useMobileForm({ onFieldChange }), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValue('email', 'new@example.com');
    });

    expect(result.current.formState.fields.email.value).toBe('new@example.com');
    expect(onFieldChange).toHaveBeenCalledWith('email', 'new@example.com');
  });

  it('should set field validation state', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValidation('email', false, ['Invalid email']);
    });

    expect(result.current.formState.fields.email.isValid).toBe(false);
    expect(result.current.formState.fields.email.errors).toEqual(['Invalid email']);
    expect(result.current.isValid).toBe(false);
  });

  it('should mark field as touched', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldTouched('email', true);
    });

    expect(result.current.formState.fields.email.isTouched).toBe(true);
  });

  it('should set field validating state', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValidating('email', true);
    });

    expect(result.current.formState.fields.email.isValidating).toBe(true);
  });

  it('should get field props with proper handlers', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    // Set up field state
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValidation('email', false, ['Invalid email']);
      result.current.setFieldTouched('email', true);
    });

    const fieldProps = result.current.getFieldProps('email');
    
    expect(fieldProps.value).toBe('test@example.com');
    expect(fieldProps.error).toBe('Invalid email');
    
    // Test onChange handler
    const mockEvent = { target: { value: 'new@example.com' } } as unknown;
    act(() => {
      fieldProps.onChange(mockEvent);
    });
    
    expect(result.current.formState.fields.email.value).toBe('new@example.com');
    
    // Test onBlur handler
    act(() => {
      fieldProps.onBlur();
    });
    
    expect(result.current.formState.fields.email.isTouched).toBe(true);
  });

  it('should not show error for untouched fields', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValue('email', 'invalid-email');
      result.current.setFieldValidation('email', false, ['Invalid email']);
      // Don't touch the field
    });

    const fieldProps = result.current.getFieldProps('email');
    expect(fieldProps.error).toBeUndefined();
  });

  it('should reset form to initial state', () => {
    const initialValues = { email: 'test@example.com' };
    const { result } = renderHook(() => useMobileForm({ initialValues }), { wrapper: Wrapper });
    
    // Make changes
    act(() => {
      result.current.setFieldValue('email', 'changed@example.com');
      result.current.setFieldTouched('email', true);
      result.current.setFieldValidation('email', false, ['Error']);
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formState.fields.email.value).toBe('test@example.com');
    expect(result.current.formState.fields.email.isTouched).toBe(false);
    expect(result.current.formState.fields.email.isValid).toBe(true);
    expect(result.current.formState.fields.email.errors).toEqual([]);
    expect(result.current.submitCount).toBe(0);
  });

  it('should handle form submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    // Set up valid form
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValidation('email', true, []);
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result.current.submitCount).toBe(1);
  });

  it('should mark all fields as touched during submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    // Set up form with untouched field
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValidation('email', true, []);
      // Don't touch the field
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(result.current.formState.fields.email.isTouched).toBe(true);
  });

  it('should not submit invalid form', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    // Set up invalid form
    act(() => {
      result.current.setFieldValue('email', 'invalid-email');
      result.current.setFieldValidation('email', false, ['Invalid email']);
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.submitCount).toBe(1);
  });

  it('should handle form submission errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const onSubmit = jest.fn().mockRejectedValue(new Error('Submit failed'));
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValidation('email', true, []);
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
    expect(result.current.isSubmitting).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('should prevent multiple simultaneous submissions', async () => {
    const onSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValidation('email', true, []);
    });

    // Start first submission
    const submitPromise1 = act(async () => {
      await result.current.submitForm();
    });

    // Try second submission while first is in progress
    await act(async () => {
      await result.current.submitForm();
    });

    await submitPromise1;

    // Should only be called once
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should handle form submit event', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMobileForm({ onSubmit }), { wrapper: Wrapper });
    
    const mockEvent = { preventDefault: jest.fn() } as unknown;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should get all form values', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValue('name', 'John Doe');
    });

    const values = result.current.getValues();
    
    expect(values).toEqual({
      email: 'test@example.com',
      name: 'John Doe'
    });
  });

  it('should get form errors', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldTouched('email', true);
      result.current.setFieldValidation('email', false, ['Invalid email']);
      result.current.setFieldValidation('name', false, ['Required']); // Not touched
    });

    const errors = result.current.getErrors();
    
    expect(errors).toEqual({
      email: ['Invalid email']
      // name should not be included because it's not touched
    });
  });

  it('should check if field has error', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldTouched('email', true);
      result.current.setFieldValidation('email', false, ['Invalid email']);
    });

    expect(result.current.hasFieldError('email')).toBe(true);
    expect(result.current.hasFieldError('name')).toBe(false);
  });

  it('should get field error message', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    act(() => {
      result.current.setFieldTouched('email', true);
      result.current.setFieldValidation('email', false, ['Invalid email', 'Second error']);
    });

    expect(result.current.getFieldError('email')).toBe('Invalid email');
    expect(result.current.getFieldError('name')).toBeUndefined();
  });

  it('should recalculate form validity when fields change', () => {
    const { result } = renderHook(() => useMobileForm(), { wrapper: Wrapper });
    
    // Start with valid form
    expect(result.current.isValid).toBe(true);

    // Add invalid field
    act(() => {
      result.current.setFieldValidation('email', false, ['Invalid']);
    });

    expect(result.current.isValid).toBe(false);

    // Fix the field
    act(() => {
      result.current.setFieldValidation('email', true, []);
    });

    expect(result.current.isValid).toBe(true);
  });
});

describe('createMobileFormValidator', () => {
  it('should validate required fields', () => {
    const validator = createMobileFormValidator({
      email: { required: true }
    });

    const emptyResult = validator('email', '');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors).toContain('email is required');

    const validResult = validator('email', 'test@example.com');
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);
  });

  it('should validate minimum length', () => {
    const validator = createMobileFormValidator({
      password: { minLength: 8 }
    });

    const shortResult = validator('password', 'short');
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors).toContain('password must be at least 8 characters');

    const validResult = validator('password', 'longenoughpassword');
    expect(validResult.isValid).toBe(true);
  });

  it('should validate maximum length', () => {
    const validator = createMobileFormValidator({
      username: { maxLength: 10 }
    });

    const longResult = validator('username', 'toolongusername');
    expect(longResult.isValid).toBe(false);
    expect(longResult.errors).toContain('username must be no more than 10 characters');

    const validResult = validator('username', 'validuser');
    expect(validResult.isValid).toBe(true);
  });

  it('should validate patterns', () => {
    const validator = createMobileFormValidator({
      email: { 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      }
    });

    const invalidResult = validator('email', 'invalid-email');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('Invalid email format');

    const validResult = validator('email', 'valid@example.com');
    expect(validResult.isValid).toBe(true);
  });

  it('should use default pattern message', () => {
    const validator = createMobileFormValidator({
      email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    });

    const result = validator('email', 'invalid');
    expect(result.errors).toContain('email format is invalid');
  });

  it('should run custom validation', () => {
    const validator = createMobileFormValidator({
      password: { 
        custom: (value: string) => {
          if (!value.includes('!')) return 'Password must contain !';
          return true;
        }
      }
    });

    const invalidResult = validator('password', 'password123');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('Password must contain !');

    const validResult = validator('password', 'password123!');
    expect(validResult.isValid).toBe(true);
  });

  it('should handle custom validation returning boolean', () => {
    const validator = createMobileFormValidator({
      username: { 
        custom: (value: string) => value !== 'admin'
      }
    });

    const invalidResult = validator('username', 'admin');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('username is invalid');

    const validResult = validator('username', 'user');
    expect(validResult.isValid).toBe(true);
  });

  it('should skip validations for empty non-required fields', () => {
    const validator = createMobileFormValidator({
      phone: { 
        pattern: /^\d+$/,
        message: 'Only numbers allowed'
      }
    });

    const result = validator('phone', '');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should run all applicable validations', () => {
    const validator = createMobileFormValidator({
      password: { 
        required: true,
        minLength: 8,
        pattern: /\d/,
        message: 'Must contain number',
        custom: (value: string) => value.includes('!') ? true : 'Must contain !'
      }
    });

    const result = validator('password', 'short');
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3); // required, minLength, pattern, custom
  });

  it('should handle fields with no rules', () => {
    const validator = createMobileFormValidator({});

    const result = validator('anyfield', 'anyvalue');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('commonValidationRules', () => {
  it('should have email validation rules', () => {
    expect(commonValidationRules.email.required).toBe(true);
    expect(commonValidationRules.email.pattern).toBeInstanceOf(RegExp);
    expect(commonValidationRules.email.maxLength).toBe(254);
  });

  it('should have password validation rules', () => {
    expect(commonValidationRules.password.required).toBe(true);
    expect(commonValidationRules.password.minLength).toBe(8);
    expect(commonValidationRules.password.maxLength).toBe(128);
    expect(typeof commonValidationRules.password.custom).toBe('function');
  });

  it('should validate password complexity', () => {
    const { custom } = commonValidationRules.password;
    
    expect(custom('password')).toBe('Password must contain at least one uppercase letter');
    expect(custom('Password')).toBe('Password must contain at least one number');
    expect(custom('Password1')).toBe(true);
  });

  it('should have phone validation rules', () => {
    expect(commonValidationRules.phone.required).toBe(false);
    expect(commonValidationRules.phone.pattern).toBeInstanceOf(RegExp);
  });

  it('should have name validation rules', () => {
    expect(commonValidationRules.name.required).toBe(true);
    expect(commonValidationRules.name.minLength).toBe(2);
    expect(commonValidationRules.name.maxLength).toBe(50);
    expect(commonValidationRules.name.pattern).toBeInstanceOf(RegExp);
  });

  it('should create confirm password rule', () => {
    const rule = commonValidationRules.confirmPassword('password');
    expect(rule.required).toBe(true);
    expect(typeof rule.custom).toBe('function');
    
    const customValidation = rule.custom as (value: string, formValues: Record<string, string>) => boolean | string;
    expect(customValidation('123', { password: '456' })).toBe('Passwords do not match');
    expect(customValidation('123', { password: '123' })).toBe(true);
  });
});