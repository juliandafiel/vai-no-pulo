import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock theme
jest.mock('../../theme', () => ({
  __esModule: true,
  default: {
    colors: {
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      primary: '#667eea',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
    },
    shadows: {
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
      },
    },
  },
}));

import Toast, { ToastType } from '../../components/Toast';

describe('Toast Component', () => {
  const mockOnHide = jest.fn();

  beforeEach(() => {
    mockOnHide.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render when visible is true', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Test message"
          type="info"
          onHide={mockOnHide}
        />
      );

      expect(getByText('Test message')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <Toast
          visible={false}
          message="Test message"
          type="info"
          onHide={mockOnHide}
        />
      );

      expect(queryByText('Test message')).toBeNull();
    });

    it('should render with success type', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Success message"
          type="success"
          onHide={mockOnHide}
        />
      );

      expect(getByText('Success message')).toBeTruthy();
    });

    it('should render with error type', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Error message"
          type="error"
          onHide={mockOnHide}
        />
      );

      expect(getByText('Error message')).toBeTruthy();
    });

    it('should render with warning type', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Warning message"
          type="warning"
          onHide={mockOnHide}
        />
      );

      expect(getByText('Warning message')).toBeTruthy();
    });

    it('should render with info type', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Info message"
          type="info"
          onHide={mockOnHide}
        />
      );

      expect(getByText('Info message')).toBeTruthy();
    });
  });

  describe('Auto Hide', () => {
    it('should auto-hide after default duration (3000ms)', async () => {
      render(
        <Toast
          visible={true}
          message="Auto hide test"
          type="info"
          onHide={mockOnHide}
        />
      );

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Wait for animation to complete
      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should auto-hide after custom duration', async () => {
      render(
        <Toast
          visible={true}
          message="Custom duration test"
          type="info"
          duration={5000}
          onHide={mockOnHide}
        />
      );

      // Should not hide before custom duration
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnHide).not.toHaveBeenCalled();

      // Should hide after custom duration
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Manual Dismiss', () => {
    it('should hide when close button is pressed', async () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Dismiss test"
          type="info"
          onHide={mockOnHide}
        />
      );

      // Press the toast content to dismiss
      fireEvent.press(getByText('Dismiss test'));

      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalled();
      });
    });
  });

  describe('Action Button', () => {
    it('should render action button when provided', () => {
      const mockAction = {
        label: 'Undo',
        onPress: jest.fn(),
      };

      const { getByText } = render(
        <Toast
          visible={true}
          message="Action test"
          type="info"
          onHide={mockOnHide}
          action={mockAction}
        />
      );

      expect(getByText('Undo')).toBeTruthy();
    });

    it('should call action onPress and hide when action button is pressed', async () => {
      const mockActionPress = jest.fn();
      const mockAction = {
        label: 'Undo',
        onPress: mockActionPress,
      };

      const { getByText } = render(
        <Toast
          visible={true}
          message="Action test"
          type="info"
          onHide={mockOnHide}
          action={mockAction}
        />
      );

      fireEvent.press(getByText('Undo'));

      expect(mockActionPress).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalled();
      });
    });
  });

  describe('All Toast Types', () => {
    const toastTypes: ToastType[] = ['success', 'error', 'warning', 'info'];

    toastTypes.forEach((type) => {
      it(`should render ${type} toast correctly`, () => {
        const { getByText } = render(
          <Toast
            visible={true}
            message={`${type} toast message`}
            type={type}
            onHide={mockOnHide}
          />
        );

        expect(getByText(`${type} toast message`)).toBeTruthy();
      });
    });
  });
});
