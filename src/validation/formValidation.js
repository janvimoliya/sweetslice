import { useState } from "react";


// Validation Rules - Reusable functions
export const required =
  (message = "This field is required") =>
  (value) => {
    if (!value || (typeof value === "string" && !value.trim())) return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return "";
  };


export const email =
  (message = "Please enter a valid email") =>
  (value) => {
    if (!value) return "";
    const emailRegex = /^[a-zA-Z0-9.-_]+@[a-zA-Z0-9]+.+[a-zA-Z]{2,4}$/;
    return emailRegex.test(value) ? "" : message;
  };


export const minLength = (length, message) => (value) => {
  if (!value) return "";
  const msg = message || `Must be at least ${length} characters`;
  return value.trim().length >= length ? "" : msg;
};


export const maxLength = (length, message) => (value) => {
  if (!value) return "";
  const msg = message || `Must be at most ${length} characters`;
  return value.trim().length <= length ? "" : msg;
};


export const min = (minValue, message) => (value) => {
  if (!value) return "";
  const msg = message || `Must be at least ${minValue}`;
  return Number(value) >= minValue ? "" : msg;
};


export const max = (maxValue, message) => (value) => {
  if (!value) return "";
  const msg = message || `Must be at most ${maxValue}`;
  return Number(value) <= maxValue ? "" : msg;
};


export const alphabetic =
  (message = "Only alphabetic characters are allowed") =>
  (value) => {
    if (!value) return "";
    const alphabeticRegex = /^[A-Za-z\s]+$/;
    return alphabeticRegex.test(value) ? "" : message;
  };


export const numeric =
  (message = "Only numeric characters are allowed") =>
  (value) => {
    if (!value) return "";
    const numericRegex = /^[0-9]+$/;
    return numericRegex.test(value) ? "" : message;
  };


export const strongPassword =
  (
    message = "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
  ) =>
  (value) => {
    if (!value) return "";
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#-_.])[A-Za-z\d@$!%*?&#-_.]{8,25}$/;
    return strongPasswordRegex.test(value) ? "" : message;
  };


export const matchField = (fieldName, message) => (value, formValues) => {
  if (!value) return "";
  const msg = message || `Must match ${fieldName}`;
  return value === formValues[fieldName] ? "" : msg;
};


export const minSelected = (count, message) => (value) => {
  const msg = message || `Select at least ${count} option(s)`;
  return Array.isArray(value) && value.length >= count ? "" : msg;
};


export const maxSelected = (count, message) => (value) => {
  const msg = message || `Select at most ${count} option(s)`;
  return Array.isArray(value) && value.length <= count ? "" : msg;
};
export const fileTypes =
  (types, message = "Invalid file type") =>
  (value) => {
    if (!value) return "";
    return types.includes(value.type) ? "" : message;
  };


export const fileSize = (maxSizeMB, message) => (value) => {
  if (!value) return "";
  const msg = message || `File must be smaller than ${maxSizeMB}MB`;
  const maxBytes = maxSizeMB * 1024 * 1024;
  return value.size <= maxBytes ? "" : msg;
};


// All rules in one object for easy access
export const rules = {
  required,
  email,
  minLength,
  maxLength,
  min,
  max,
  alphabetic,
  numeric,
  strongPassword,
  matchField,
  minSelected,
  maxSelected,
  fileTypes,
  fileSize,
};


// Validate a single field against its rules
export const validateField = (value, rules, formValues = {}) => {
  for (const rule of rules) {
    const error = rule(value, formValues);
    if (error) return error;
  }
  return "";
};


// Validate all fields in a form
export const validateAllFields = (formValues, validationRules) => {
  const errors = {};


  Object.keys(validationRules).forEach((fieldName) => {
    const error = validateField(
      formValues[fieldName],
      validationRules[fieldName],
      formValues,
    );
    if (error) {
      errors[fieldName] = error;
    }
  });


  return errors;
};


export const useFormValidation = ({
  initialValues,
  validationRules,
  onSubmit,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});


  const hasFieldValue = (value) => {
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    return value !== undefined && value !== null && value !== "";
  };


  const setFieldValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));


    if (errors[name]) {
      const fieldRules = validationRules[name] || [];
      const fieldError = validateField(value, fieldRules, {
        ...values,
        [name]: value,
      });


      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };


  const handleChange = (event) => {
    const { name, type, checked, value, files } = event.target;


    let nextValue;


    if (type === "checkbox") {
      // Case 1: Array checkboxes (e.g., interests[], roles[])
      // - You want values[name] = array of selected values
      if (Array.isArray(values[name])) {
        const arr = values[name] || [];
        if (checked) {
          nextValue = [...arr, value]; // add value to array
        } else {
          nextValue = arr.filter((item) => item !== value); // remove value
        }
      }
      // Case 2: Boolean checkbox (acceptTerms, remember, etc.)
      else {
        nextValue = checked; // true or false
      }
    } else if (type === "file") {
      nextValue = files?.[0] || null;
    } else {
      nextValue = value;
    }


    setFieldValue(name, nextValue);
    setTouched((prev) => ({ ...prev, [name]: true }));


    const fieldRules = validationRules[name] || [];
    const fieldError = validateField(nextValue, fieldRules, {
      ...values,
      [name]: nextValue,
    });
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };


  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldRules = validationRules[name] || [];
    const fieldError = validateField(values[name], fieldRules, values);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    const formErrors = validateAllFields(values, validationRules);
    setErrors(formErrors);


    if (Object.keys(formErrors).length === 0 && onSubmit) {
      onSubmit(values, resetForm);
    }
  };


  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };


  const getInputClass = (fieldName, baseClass = "form-control") => {
    const hasError = Boolean(errors[fieldName]);
    const showValid =
      touched[fieldName] && !hasError && hasFieldValue(values[fieldName]);


    if (hasError) return `${baseClass} is-invalid`;
    if (showValid) return `${baseClass} is-valid`;
    return baseClass;
  };


  return {
    values,
    errors,
    setErrors,
    setFieldValue,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getInputClass,
    touched,
  };
};


