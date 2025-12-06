import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, File as FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { analyzeFile } from '../services/geminiService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (project: Project) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setFile(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const handleClose = () => {
    if (isProcessing) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Limit file size to 4MB for this demo to avoid browser storage quotas/base64 lag
      if (selectedFile.size > 4 * 1024 * 1024) {
        setError("File size exceeds 4MB limit for this demo.");
        return;
      }
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename
        setTitle(selectedFile.name.split('.')[0]);
      }
      setError(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await convertToBase64(file);
      
      const newProject: Project = {
        id: crypto.randomUUID(),
        title,
        description: 'Waiting for analysis...',
        tags: [],
        fileType: file.type,
        fileName: file.name,
        fileData: base64Data,
        uploadDate: new Date().toISOString(),
        status: 'analyzing'
      };

      // Add project immediately to UI
      onUpload(newProject);
      
      // Close modal
      handleClose();

      // Trigger analysis in background (in a real app this would be server-side or a separate effect)
      // Here we will do it "optimistically" but actual update happens in App.tsx via a passed handler
      // Wait, simpler pattern: The App handles the async update. 
      // We'll just return the initial object and let App handle the API call.
      
    } catch (err) {
      console.error(err);
      setError("Failed to process file. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Upload Project</h2>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Project Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Marketing Dashboard Mockup"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
              />
            </div>

            {/* File Drop Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project File
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                  ${file ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,application/pdf,text/plain"
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-primary-700">
                    <FileIcon size={32} className="mb-2" />
                    <span className="text-sm font-semibold break-all">{file.name}</span>
                    <span className="text-xs opacity-70 mt-1">{(file.size / 1024).toFixed(0)} KB</span>
                    <span className="text-xs text-primary-600 mt-2 font-medium">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <UploadCloud size={32} className="mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Click to upload</span>
                    <span className="text-xs mt-1">SVG, PNG, JPG or GIF (max 4MB)</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || !file || !title}
                className={`
                  w-full flex items-center justify-center py-2.5 rounded-lg font-semibold text-white transition-all
                  ${(isProcessing || !file || !title) 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upload Project'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
