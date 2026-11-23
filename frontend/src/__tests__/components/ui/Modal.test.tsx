import { render, screen } from '@testing-library/react';
import Modal from '../../../components/ui/Modal';

describe('Modal', () => {
  test('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()} title="New Lead">
        <p>content</p>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('bounds the dialog to the viewport with an internal scroll area', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="New Lead">
        <p>content</p>
      </Modal>
    );
    const dialog = screen.getByTestId('modal-dialog');
    expect(dialog.className).toContain('max-h-[90vh]');
    const scroll = screen.getByTestId('modal-scroll');
    expect(scroll.className).toContain('overflow-y-auto');
    // Title and Close stay reachable (outside the scroll area).
    expect(screen.getByText('New Lead')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
