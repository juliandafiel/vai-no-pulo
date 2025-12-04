import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock useAuth
const mockSignIn = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    loading: false,
    signed: false,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Spy on Alert
jest.spyOn(Alert, 'alert');

import LoginScreen from '../../screens/LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockNavigate.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render login screen with all elements', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      expect(getByText('Vai no Pulo')).toBeTruthy();
      expect(getByText('Conectando pessoas e mercadorias')).toBeTruthy();
      expect(getByPlaceholderText('E-mail')).toBeTruthy();
      expect(getByPlaceholderText('Senha')).toBeTruthy();
      expect(getByText('Entrar')).toBeTruthy();
      expect(getByText('Esqueceu a senha?')).toBeTruthy();
      expect(getByText('Criar uma conta')).toBeTruthy();
    });
  });

  describe('Form Input', () => {
    it('should update email input', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const emailInput = getByPlaceholderText('E-mail');

      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password input', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Senha');

      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Login Flow', () => {
    it('should call signIn with email and password', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show error alert on login failure', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Login failed'));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'wrong@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'wrongpassword');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro',
          'Não foi possível fazer login. Verifique suas credenciais.'
        );
      });
    });

    it('should show pending status message', async () => {
      mockSignIn.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Seu cadastro esta em analise',
            profileStatus: 'PENDING',
          },
        },
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'pending@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Cadastro em Análise',
          'Seu cadastro esta em analise',
          expect.any(Array)
        );
      });
    });

    it('should show rejected status message', async () => {
      mockSignIn.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Seu cadastro foi rejeitado',
            profileStatus: 'REJECTED',
          },
        },
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'rejected@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Cadastro Rejeitado',
          'Seu cadastro foi rejeitado',
          expect.any(Array)
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to RegisterType when create account is pressed', () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Criar uma conta'));

      expect(mockNavigate).toHaveBeenCalledWith('RegisterType');
    });
  });

  describe('Forgot Password Modal', () => {
    it('should open forgot password modal', () => {
      const { getByText, queryByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Esqueceu a senha?'));

      expect(getByText('Recuperar Senha')).toBeTruthy();
    });

    it('should close modal when cancel is pressed', async () => {
      const { getByText, queryByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Esqueceu a senha?'));
      expect(getByText('Recuperar Senha')).toBeTruthy();

      fireEvent.press(getByText('Cancelar'));

      await waitFor(() => {
        expect(queryByText('Recuperar Senha')).toBeNull();
      });
    });

    it('should show confirmation when email is submitted', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText('Esqueceu a senha?'));

      const modalEmailInput = getByPlaceholderText('Digite seu e-mail');
      fireEvent.changeText(modalEmailInput, 'forgot@example.com');

      fireEvent.press(getByText('Enviar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'E-mail enviado',
          'Verifique sua caixa de entrada'
        );
      });
    });
  });

  describe('Input Focus Animations', () => {
    it('should handle email input focus and blur', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const emailInput = getByPlaceholderText('E-mail');

      fireEvent(emailInput, 'focus');
      fireEvent(emailInput, 'blur');

      // Animation should complete without errors
      expect(emailInput).toBeTruthy();
    });

    it('should handle password input focus and blur', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Senha');

      fireEvent(passwordInput, 'focus');
      fireEvent(passwordInput, 'blur');

      // Animation should complete without errors
      expect(passwordInput).toBeTruthy();
    });
  });
});
