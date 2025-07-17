import { z } from 'zod'

// Production-level feedback form validation schema
export const feedbackFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  
  topic: z
    .string()
    .min(3, 'Topic must be at least 3 characters')
    .max(100, 'Topic must be less than 100 characters')
    .trim(),
  
  rating: z
    .number()
    .min(1, 'Please select a rating')
    .max(5, 'Rating must be between 1 and 5'),
  
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters')
    .max(1000, 'Comments must be less than 1000 characters')
    .trim(),
})

// Type inference from schema
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>

// Validation error messages
export const validationMessages = {
  name: {
    required: 'Name is required',
    min: 'Name must be at least 2 characters',
    max: 'Name must be less than 50 characters',
    invalid: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    min: 'Email must be at least 5 characters',
    max: 'Email must be less than 100 characters',
  },
  topic: {
    required: 'Topic is required',
    min: 'Topic must be at least 5 characters',
    max: 'Topic must be less than 100 characters',
  },
  rating: {
    required: 'Please select a rating',
    min: 'Rating must be at least 1',
    max: 'Rating must be at most 5',
  },
  comments: {
    required: 'Comments are required',
    min: 'Comments must be at least 10 characters',
    max: 'Comments must be less than 1000 characters',
  },
} 