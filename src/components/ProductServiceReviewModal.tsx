import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, Send } from 'lucide-react';
import { Language } from '../types';

export interface ProductServiceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName?: string;
  targetType?: 'product' | 'service' | 'provider';
  onSubmitReview?: (reviewData: { rating: number; comment: string; targetName?: string }) => void;
  lang?: Language;
}

export const ProductServiceReviewModal: React.FC<ProductServiceReviewModalProps> = ({
  isOpen,
  onClose,
  targetName = 'পণ্য বা সেবা',
  targetType = 'service',
  onSubmitReview,
  lang = 'bn'
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // মডিউল বন্ধ হলে বা পুনরায় খুললে স্টেট রিসেট করার জন্য
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setComment('');
      setIsSubmitted(false);
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (rating < 1) {
      setValidationError('অনুগ্রহ করে অন্তত ১টি স্টার নির্বাচন করুন।');
      return;
    }
    if (!comment.trim()) {
      setValidationError('অনুগ্রহ করে আপনার বিস্তারিত অভিজ্ঞতা বা মতামত লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (onSubmitReview) {
        onSubmitReview({ rating, comment: comment.trim(), targetName });
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setValidationError(err?.message || 'মতামত সাবমিট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'অসাধারণ অভিজ্ঞতা (Excellent)';
      case 4:
        return 'খুব ভালো (Very Good)';
      case 3:
        return 'মোটামুটি সন্তোষজনক (Good)';
      case 2:
        return 'উন্নতি প্রয়োজন (Needs Improvement)';
      case 1:
        return 'অসন্তোষজনক (Poor)';
      default:
        return 'রেটিং নির্বাচন করুন';
    }
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      id="product-service-review-modal-overlay"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#fbf9f4] border-2 border-[#2d6a4f]/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#f4f0e6] border-b-2 border-[#2d6a4f]/20 px-5 sm:px-7 py-4 sm:py-5 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                {targetName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1b4332] tracking-tight leading-tight">
              আপনার অভিজ্ঞতা শেয়ার করুন
            </h2>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#2d6a4f]/90 mt-1 leading-snug">
              আপনার মতামত অন্যদের সঠিক সিদ্ধান্ত নিতে সাহায্য করবে।
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-[#2d6a4f]/15 text-[#1b4332] transition cursor-pointer border border-[#2d6a4f]/20 shrink-0 ml-2"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#e7efe9] text-[#1b4332] rounded-full flex items-center justify-center mx-auto border-2 border-[#1b4332]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1b4332]">
                ধন্যবাদ! আপনার রিভিউ জমা হয়েছে
              </h3>
              <p className="text-sm sm:text-base text-[#2d6a4f] max-w-sm mx-auto leading-relaxed">
                আপনার মূল্যবান মতামত প্রকাশিত হয়েছে এবং সম্প্রদায়ের নির্ভরযোগ্যতা বৃদ্ধি করেছে।
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-sm sm:text-base rounded-xl transition cursor-pointer"
                >
                  সম্পন্ন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {validationError && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Star Rating */}
              <div className="bg-white border-2 border-[#2d6a4f]/25 rounded-2xl p-5 text-center space-y-2 shadow-xs">
                <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                  সামগ্রিক রেটিং প্রদান করুন
                </label>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentDisplayRating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 sm:p-2 transition-transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                        aria-label={`${starValue} স্টার`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                              : 'fill-transparent text-stone-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs sm:text-sm font-black text-[#1b4332] bg-[#f4f0e6] py-1 px-3 rounded-full inline-block">
                  {getRatingLabel(currentDisplayRating)}
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                  আপনার বিস্তারিত মূল্যায়ন লিখুন <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="পণ্য বা সেবাটি আপনার কেমন লেগেছে? বিস্তারিত লিখুন..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-[#2d6a4f]/30 rounded-xl text-base text-[#1b4332] font-medium placeholder:text-stone-400 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition leading-relaxed resize-none"
                ></textarea>
                <p className="text-xs text-[#2d6a4f]/80 font-medium">
                  কাজের মান, সময়ানুবর্তিতা ও ব্যবহার সম্পর্কে খোলামেলা লিখুন।
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  <span>{isSubmitting ? 'মতামত জমা হচ্ছে...' : 'মতামত প্রকাশ করুন'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};