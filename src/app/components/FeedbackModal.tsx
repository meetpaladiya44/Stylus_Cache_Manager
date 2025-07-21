"use client"
import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const modalContent = {
  hidden: { y: 60, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: 60, opacity: 0 },
};

const FeedbackModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tryClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, isSubmitting]);

  // Trap focus inside modal
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();
  }, [open]);

  // Restore focus to button on close
  useEffect(() => {
    if (!open && buttonRef.current) buttonRef.current.focus();
  }, [open]);

  // Close on overlay click
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) tryClose();
  }, [isSubmitting]);

  // Try to close modal, warn if submitting
  const tryClose = useCallback(() => {
    if (isSubmitting) {
      if (window.confirm("Your feedback is still being submitted. Are you sure you want to close and lose your input?")) {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  }, [isSubmitting]);

  // Callback for FeedbackForm to notify modal of submitting state
  const handleSubmitting = (submitting: boolean) => setIsSubmitting(submitting);
  // Callback for FeedbackForm to notify modal of successful submit
  const handleSuccess = () => setOpen(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        ref={buttonRef}
        aria-label="Open feedback form"
        className="fixed z-50 bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl p-4 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400/70 transition-all"
        onClick={() => setOpen(true)}
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-semibold">Feedback</span>
      </button>
      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdrop}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              ref={modalRef}
              className="relative w-full max-w-lg mx-2 bg-zinc-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-800/60 p-0"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              tabIndex={-1}
            >
              {/* Close button */}
              <button
                aria-label="Close feedback form"
                className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-100 bg-zinc-800/60 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition"
                onClick={tryClose}
                disabled={false}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6 pt-12">
                <FeedbackForm onSubmitting={handleSubmitting} onSuccess={handleSuccess} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackModal; 