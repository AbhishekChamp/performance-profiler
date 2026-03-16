import { useState } from 'react';
import { FileText, FolderPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => void | Promise<void>;
}

export function CreateProjectDialog({ isOpen, onClose, onCreate }: CreateProjectDialogProps): React.ReactNode {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    onCreate(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  const handleClose = (): void => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description="Create a new project to organize your files and analysis reports."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-dev-text mb-2">
            Project Name <span className="text-dev-danger">*</span>
          </label>
          <div className="relative">
            <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dev-text-muted" />
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., My Website Performance"
              className="w-full pl-10 pr-4 py-2.5 bg-dev-bg border border-dev-border rounded-lg
                         text-sm text-dev-text placeholder-dev-text-subtle
                         focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                         focus:border-dev-accent"
            />
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-dev-danger">{error}</p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-dev-text mb-2">
            Description <span className="text-dev-text-muted">(optional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-dev-text-muted" />
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your project..."
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 bg-dev-bg border border-dev-border rounded-lg
                         text-sm text-dev-text placeholder-dev-text-subtle
                         focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                         focus:border-dev-accent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="dev-button-secondary px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="dev-button px-4 py-2"
          >
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
}
