import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Vertical padding for scroll space */}
      <div className="min-h-full w-full flex items-start justify-center py-8 px-4">
        <div
          className={cn(
            'relative w-full bg-card rounded-2xl shadow-xl animate-slide-up',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-border bg-card rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
