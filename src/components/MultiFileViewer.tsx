import { useState } from 'react';
import { X, Eye, FileText, File, Image as ImageIcon, FileSpreadsheet, Presentation, FileType as FileTypeIcon, Calculator, Code, Atom, Award } from 'lucide-react';
import FileViewer from '@/components/FileViewer';

interface FileInfo {
  url: string;
  name: string;
  type: string;
  size?: number;
}

interface MultiFileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Files grouped by subject (for subject_config materials) */
  subjectFiles?: Record<string, FileInfo[]>;
  /** Flat list of files (for non-subject materials with multiple files) */
  files?: FileInfo[];
}

const subjectNames: Record<string, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

const subjectIcons: Record<string, typeof Calculator> = {
  matematica: Calculator,
  informatica: Code,
  fizica: Atom,
};

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="w-4 h-4" />;
  const type = fileType.toLowerCase();
  if (type === 'jpg' || type === 'jpeg' || type === 'png') return <ImageIcon className="w-4 h-4" />;
  if (type === 'pdf') return <FileText className="w-4 h-4" />;
  if (type === 'xls' || type === 'xlsx' || type === 'csv') return <FileSpreadsheet className="w-4 h-4" />;
  if (type === 'doc' || type === 'docx') return <FileTypeIcon className="w-4 h-4" />;
  if (type === 'ppt' || type === 'pptx') return <Presentation className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const getFileTypeLabel = (type?: string) => {
  if (!type) return 'Fișier';
  const labels: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
    jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
  };
  return labels[type.toLowerCase()] || type.toUpperCase();
};

const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return '';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
};

/**
 * Extracts all files from a material's subject_config.
 * Returns a Record<subject, FileInfo[]> for grouped display.
 */
export const extractSubjectFiles = (subjectConfig: Record<string, any>): Record<string, FileInfo[]> => {
  const result: Record<string, FileInfo[]> = {};
  for (const [subj, cfg] of Object.entries(subjectConfig)) {
    const files: FileInfo[] = [];
    if (cfg.files && Array.isArray(cfg.files) && cfg.files.length > 0) {
      files.push(...cfg.files);
    } else if (cfg.fileUrl) {
      files.push({ url: cfg.fileUrl, name: cfg.fileName || subj, type: cfg.fileType || 'pdf', size: cfg.fileSize || 0 });
    }
    if (files.length > 0) {
      result[subj] = files;
    }
  }
  return result;
};

const MultiFileViewer = ({ isOpen, onClose, title, subjectFiles, files }: MultiFileViewerProps) => {
  const [viewingFile, setViewingFile] = useState<FileInfo | null>(null);

  if (!isOpen) return null;

  // If viewing a single file from the list
  if (viewingFile) {
    return (
      <FileViewer
        isOpen={true}
        onClose={() => setViewingFile(null)}
        fileUrl={viewingFile.url}
        fileName={viewingFile.name}
        fileType={viewingFile.type}
      />
    );
  }

  const renderFileButton = (file: FileInfo, idx: number) => (
    <button
      key={idx}
      className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-gold/50 hover:bg-muted transition-all text-left"
      onClick={(e) => {
        e.stopPropagation();
        setViewingFile(file);
      }}
    >
      {getFileIcon(file.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {getFileTypeLabel(file.type)}
          {file.size && file.size > 0 && ` • ${formatFileSize(file.size)}`}
        </p>
      </div>
      <Eye className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display text-xl text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">Toate documentele disponibile</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Subject-grouped files */}
          {subjectFiles && Object.entries(subjectFiles).map(([subj, subjFiles]) => {
            const Icon = subjectIcons[subj] || Award;
            if (subjFiles.length === 0) return null;
            return (
              <div key={subj} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gold" />
                  <h3 className="font-medium text-foreground">{subjectNames[subj] || subj}</h3>
                </div>
                {subjFiles.map((file, idx) => renderFileButton(file, idx))}
              </div>
            );
          })}

          {/* Flat file list */}
          {files && files.map((file, idx) => renderFileButton(file, idx))}
        </div>
      </div>
    </div>
  );
};

export default MultiFileViewer;
