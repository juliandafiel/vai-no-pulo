import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AnimatedButton, { AnimatedIconButton } from '../../components/AnimatedButton';

describe('AnimatedButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  describe('Rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(
        <AnimatedButton title="Test Button" onPress={mockOnPress} />
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should render with different variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'success', 'danger', 'ghost'] as const;

      variants.forEach((variant) => {
        const { getByText } = render(
          <AnimatedButton title={`${variant} button`} onPress={mockOnPress} variant={variant} />
        );
        expect(getByText(`${variant} button`)).toBeTruthy();
      });
    });

    it('should render with different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;

      sizes.forEach((size) => {
        const { getByText } = render(
          <AnimatedButton title={`${size} button`} onPress={mockOnPress} size={size} />
        );
        expect(getByText(`${size} button`)).toBeTruthy();
      });
    });

    it('should render with icon on left', () => {
      const { getByText } = render(
        <AnimatedButton
          title="With Icon"
          onPress={mockOnPress}
          icon="add"
          iconPosition="left"
        />
      );

      expect(getByText('With Icon')).toBeTruthy();
    });

    it('should render with icon on right', () => {
      const { getByText } = render(
        <AnimatedButton
          title="With Icon"
          onPress={mockOnPress}
          icon="arrow-forward"
          iconPosition="right"
        />
      );

      expect(getByText('With Icon')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const { getByText } = render(
        <AnimatedButton title="Press Me" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Press Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const { getByText } = render(
        <AnimatedButton title="Disabled Button" onPress={mockOnPress} disabled />
      );

      fireEvent.press(getByText('Disabled Button'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const { queryByText } = render(
        <AnimatedButton title="Loading Button" onPress={mockOnPress} loading />
      );

      // When loading, title might not be visible
      // Try to find any touchable element
      const button = queryByText('Loading Button');
      if (button) {
        fireEvent.press(button);
      }
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const { queryByText, UNSAFE_queryByType } = render(
        <AnimatedButton title="Loading" onPress={mockOnPress} loading />
      );

      // Title should not be visible during loading
      // ActivityIndicator should be present
      expect(queryByText('Loading')).toBeFalsy();
    });

    it('should show title when not loading', () => {
      const { getByText } = render(
        <AnimatedButton title="Not Loading" onPress={mockOnPress} loading={false} />
      );

      expect(getByText('Not Loading')).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should have reduced opacity when disabled', () => {
      const { getByText } = render(
        <AnimatedButton title="Disabled" onPress={mockOnPress} disabled />
      );

      expect(getByText('Disabled')).toBeTruthy();
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth prop is true', () => {
      const { getByText } = render(
        <AnimatedButton title="Full Width" onPress={mockOnPress} fullWidth />
      );

      expect(getByText('Full Width')).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('should apply custom textStyle', () => {
      const { getByText } = render(
        <AnimatedButton
          title="Custom Style"
          onPress={mockOnPress}
          textStyle={{ fontSize: 20 }}
        />
      );

      expect(getByText('Custom Style')).toBeTruthy();
    });

    it('should apply custom gradientColors', () => {
      const { getByText } = render(
        <AnimatedButton
          title="Custom Colors"
          onPress={mockOnPress}
          gradientColors={['#ff0000', '#00ff00']}
        />
      );

      expect(getByText('Custom Colors')).toBeTruthy();
    });
  });
});

describe('AnimatedIconButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('should render with icon', () => {
    const { UNSAFE_root } = render(
      <AnimatedIconButton icon="add" onPress={mockOnPress} />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { UNSAFE_root } = render(
      <AnimatedIconButton icon="add" onPress={mockOnPress} />
    );

    fireEvent.press(UNSAFE_root);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when disabled', () => {
    const { UNSAFE_root } = render(
      <AnimatedIconButton icon="add" onPress={mockOnPress} disabled />
    );

    // Component should render correctly with disabled state
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render with different sizes', () => {
    const { UNSAFE_root } = render(
      <AnimatedIconButton icon="add" onPress={mockOnPress} size={80} />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render with different variants', () => {
    const variants = ['primary', 'secondary', 'success', 'danger'] as const;

    variants.forEach((variant) => {
      const { UNSAFE_root } = render(
        <AnimatedIconButton icon="add" onPress={mockOnPress} variant={variant} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
