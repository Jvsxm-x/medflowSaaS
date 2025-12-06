import React from 'react';
import { Project } from '../types';
import { FileText, Image as ImageIcon, File, Calendar, Tag, Loader2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const isImage = project.fileType.startsWith('image/');
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      {/* Card Header / Preview */}
      <div className="h-40 bg-slate-100 relative group overflow-hidden">
        {isImage ? (
          <img 
            src={project.fileData} 
            alt={project.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <FileText size={48} />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
                onClick={() => onDelete(project.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-600 transition-colors"
            >
                Delete
            </button>
        </div>
        
        {/* File Type Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1">
          {isImage ? <ImageIcon size={12} /> : <File size={12} />}
          {project.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-slate-900 text-lg line-clamp-1" title={project.title}>
            {project.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <Calendar size={12} />
            <span>{formatDate(project.uploadDate)}</span>
        </div>

        <div className="flex-grow">
            {project.status === 'analyzing' ? (
                 <div className="flex items-center gap-2 text-primary-600 text-sm animate-pulse bg-primary-50 p-3 rounded-lg">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini is analyzing...</span>
                 </div>
            ) : (
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {project.description}
                </p>
            )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100">
          {project.status === 'ready' && project.tags.map((tag, idx) => (
            <span 
                key={idx} 
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
            >
              <Tag size={10} className="mr-1 opacity-50" />
              {tag}
            </span>
          ))}
          {project.status === 'analyzing' && (
              <span className="h-5 w-20 bg-slate-100 rounded animate-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
