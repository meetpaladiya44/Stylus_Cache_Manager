'use client'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Star, Send } from 'lucide-react'
import { feedbackFormSchema, type FeedbackFormData } from '@/lib/validations/feedback'

const starVariants = {
  hover: { scale: 1.2, color: '#fbbf24' },
  tap: { scale: 0.95 },
}

// Add prop types for modal communication
interface FeedbackFormProps {
  onSubmitting?: (submitting: boolean) => void;
  onSuccess?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmitting, onSuccess }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { rating: 0 },
    mode: 'onBlur',
  })

  // Notify parent about submitting state
  React.useEffect(() => {
    if (onSubmitting) onSubmitting(isSubmitting)
  }, [isSubmitting, onSubmitting])

  // Handle form submission with Zod validation
  const onSubmit = async (data: FeedbackFormData) => {
    try {
      if (onSubmitting) onSubmitting(true)
      const validatedData = feedbackFormSchema.parse(data)
      const promise = fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(errorText || 'Failed to submit feedback')
        }
        return res.json()
      })

      toast.promise(
        promise,
        {
          loading: 'Submitting your feedback...',
          success: 'Thank you for your feedback! We appreciate your input.',
          error: (err) => err.message || 'Something went wrong. Please try again.',
        },
        { 
          style: { 
            borderRadius: '12px', 
            background: '#18181b', 
            color: '#fff',
            fontSize: '14px',
            padding: '16px',
          },
          duration: 4000,
        }
      )

      await promise
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Validation failed. Please check your input and try again.')
    } finally {
      if (onSubmitting) onSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] px-2">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-lg bg-zinc-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-800/60 p-8 flex flex-col gap-6"
        aria-label="Feedback form"
      >
        <h2 className="text-2xl font-bold text-zinc-100 mb-2 text-center">We value your feedback</h2>
        
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-zinc-300 font-medium mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={`w-full px-4 py-2 rounded-xl bg-zinc-800/70 border transition-all duration-200 focus:outline-none focus:ring-2 ${
              errors.name 
                ? 'border-red-500/60 focus:ring-red-500/60' 
                : 'border-zinc-700/60 focus:ring-blue-500/60'
            } text-zinc-100 placeholder-zinc-500`}
            placeholder="Your full name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" className="text-red-400 text-xs mt-1 block">
              {errors.name.message}
            </span>
          )}
        </div>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-zinc-300 font-medium mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full px-4 py-2 rounded-xl bg-zinc-800/70 border transition-all duration-200 focus:outline-none focus:ring-2 ${
              errors.email 
                ? 'border-red-500/60 focus:ring-red-500/60' 
                : 'border-zinc-700/60 focus:ring-blue-500/60'
            } text-zinc-100 placeholder-zinc-500`}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="text-red-400 text-xs mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>
        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-zinc-300 font-medium mb-1">
            Topic <span className="text-red-400">*</span>
          </label>
          <input
            id="topic"
            type="text"
            {...register('topic')}
            className={`w-full px-4 py-2 rounded-xl bg-zinc-800/70 border transition-all duration-200 focus:outline-none focus:ring-2 ${
              errors.topic 
                ? 'border-red-500/60 focus:ring-red-500/60' 
                : 'border-zinc-700/60 focus:ring-blue-500/60'
            } text-zinc-100 placeholder-zinc-500`}
            placeholder="What is your feedback about?"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? 'topic-error' : undefined}
          />
          {errors.topic && (
            <span id="topic-error" className="text-red-400 text-xs mt-1 block">
              {errors.topic.message}
            </span>
          )}
        </div>
        {/* Rating */}
        <div>
          <label className="block text-zinc-300 font-medium mb-1">
            Rating <span className="text-red-400">*</span>
          </label>
          <Controller
            control={control}
            name="rating"
            render={({ field: { value, onChange } }) => (
              <div className="flex gap-1 items-center" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    variants={starVariants}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={value === star}
                    tabIndex={0}
                    className={`rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      value >= star ? 'text-yellow-400' : 'text-zinc-500'
                    }`}
                  >
                    <Star fill={value >= star ? '#fbbf24' : 'none'} className="w-6 h-6" />
                  </motion.button>
                ))}
              </div>
            )}
          />
          {errors.rating && (
            <span className="text-red-400 text-xs mt-1 block">
              {errors.rating.message}
            </span>
          )}
        </div>
        {/* Comments */}
        <div>
          <label htmlFor="comments" className="block text-zinc-300 font-medium mb-1">
            Comments <span className="text-red-400">*</span>
          </label>
          <textarea
            id="comments"
            rows={4}
            {...register('comments')}
            className={`w-full px-4 py-2 rounded-xl bg-zinc-800/70 border transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
              errors.comments 
                ? 'border-red-500/60 focus:ring-red-500/60' 
                : 'border-zinc-700/60 focus:ring-blue-500/60'
            } text-zinc-100 placeholder-zinc-500`}
            placeholder="Share your thoughts and suggestions..."
            aria-invalid={!!errors.comments}
            aria-describedby={errors.comments ? 'comments-error' : undefined}
          />
          {errors.comments && (
            <span id="comments-error" className="text-red-400 text-xs mt-1 block">
              {errors.comments.message}
            </span>
          )}
        </div>
        {/* Submit Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02, backgroundColor: '#2563eb' }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </motion.button>
      </motion.form>
    </div>
  )
}

export default FeedbackForm 