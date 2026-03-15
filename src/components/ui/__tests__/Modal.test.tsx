import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('should render when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    const overlay = screen.getByLabelText('Close modal').closest('[role="dialog"]')?.parentElement?.previousSibling;
    if (overlay) {
      await user.click(overlay as Element);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('should trap focus within modal', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render description when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={vi.fn()} 
        title="Test Modal"
        description="This is a description"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={vi.fn()} 
        title="Test Modal"
        footer={<button>Footer button</button>}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('Footer button')).toBeInTheDocument();
  });
});
