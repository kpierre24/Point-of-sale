"use client"

import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  min?: number | { value: number; message: string }
  max?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  email?: boolean | string
  custom?: (value: any) => string | undefined
}

export interface FieldConfig {
  [key: string]: ValidationRule
}

export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormTouched {
  [key: string]: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationConfig: FieldConfig = {}
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const rules = validationConfig[name]
    if (!rules) return undefined

    // Required validation
    if (rules.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
                     (Array.isArray(value) && value.length === 0)
      if (isEmpty) {
        return typeof rules.required === 'string' 
          ? rules.required 
          : `${name.charAt(0).toUpperCase() + name.slice(1)} is required`
      }
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    // Email validation
    if (rules.email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return typeof rules.email === 'string' 
          ? rules.email 
          : 'Please enter a valid email address'
      }
    }

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength) {
        const minLength = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value
        const message = typeof rules.minLength === 'object' 
          ? rules.minLength.message 
          : `Must be at least ${minLength} characters`
        if (value.length < minLength) return message
      }

      if (rules.maxLength) {
        const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value
        const message = typeof rules.maxLength === 'object' 
          ? rules.maxLength.message 
          : `Must be no more than ${maxLength} characters`
        if (value.length > maxLength) return message
      }
    }

    // Numeric validations
    if (typeof value === 'number') {
      if (rules.min !== undefined) {
        const min = typeof rules.min === 'number' ? rules.min : rules.min.value
        const message = typeof rules.min === 'object' 
          ? rules.min.message 
          : `Must be at least ${min}`
        if (value < min) return message
      }

      if (rules.max !== undefined) {
        const max = typeof rules.max === 'number' ? rules.max : rules.max.value
        const message = typeof rules.max === 'object' 
          ? rules.max.message 
          : `Must be no more than ${max}`
        if (value > max) return message
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      const pattern = typeof rules.pattern === 'object' ? rules.pattern.value : rules.pattern
      const message = typeof rules.pattern === 'object' 
        ? rules.pattern.message 
        : 'Invalid format'
      if (!pattern.test(value)) return message
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return undefined
  }, [validationConfig])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(validationConfig).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField, validationConfig])

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate field on blur
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [validateField, values])

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true)
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationConfig).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as FormTouched)
    setTouched(allTouched)

    try {
      const isValid = validateForm()
      if (isValid) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm, validationConfig])

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((name: string, value: any) => {
    handleChange(name, value)
  }, [handleChange])

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues),
  }
}