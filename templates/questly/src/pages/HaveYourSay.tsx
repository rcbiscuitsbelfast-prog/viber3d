import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';
import MenuOverlayController from '@/components/MenuOverlayController';

type FeedbackCategory = 'suggestion' | 'question' | 'complaint' | 'report_quest';

interface FeedbackSubmission {
  category: FeedbackCategory;
  message: string;
  timestamp: number;
}

const FEEDBACK_STORAGE_KEY = 'questly_feedback_submissions';

export default function HaveYourSay() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    // Save to localStorage
    try {
      const submissions: FeedbackSubmission[] = JSON.parse(
        localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]'
      );

      const newSubmission: FeedbackSubmission = {
        category,
        message: message.trim(),
        timestamp: Date.now(),
      };

      submissions.push(newSubmission);
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(submissions));

      // Show success message
      setIsSubmitted(true);
      setMessage('');

      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ParallaxBackground>
      <div className="max-w-2xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <button
            onClick={() => navigate('/menu')}
            className="text-primary hover:underline flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-primary">
            Have Your Say
          </h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="parchment-box p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold font-serif text-primary">
              Share Your Feedback
            </h2>
          </div>

          <p className="text-muted-foreground mb-6">
            We'd love to hear from you! Whether you have a suggestion, question, complaint, or need to report something, your feedback helps us improve Questly.
          </p>

          {/* Success Message */}
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-green-800"
            >
              <p className="font-semibold">Thank you for your feedback!</p>
              <p className="text-sm">Your message has been submitted successfully.</p>
            </motion.div>
          )}

          {/* Category Dropdown */}
          <div className="mb-6" data-help-id="category-selector">
            <label className="block text-sm font-semibold text-primary mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="w-full p-3 bg-white border-2 border-primary/30 rounded-lg text-foreground focus:outline-none focus:border-primary font-medium"
            >
              <option value="suggestion">Suggestion</option>
              <option value="question">Question</option>
              <option value="complaint">Complaint</option>
              <option value="report_quest">Report Quest</option>
            </select>
          </div>

          {/* Message Text Area */}
          <div className="mb-6" data-help-id="message-input">
            <label className="block text-sm font-semibold text-primary mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={8}
              className="w-full p-3 bg-white border-2 border-primary/30 rounded-lg text-foreground focus:outline-none focus:border-primary resize-none font-display"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <CustomButton
              onClick={() => navigate('/menu')}
              className="px-6"
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              className="px-6 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </CustomButton>
          </div>
        </motion.div>
      </div>

      <MenuOverlayController />
    </ParallaxBackground>
  );
}
