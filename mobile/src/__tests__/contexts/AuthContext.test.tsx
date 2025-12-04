import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock API
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    defaults: {
      headers: {},
    },
  },
  setOnUnauthorizedCallback: jest.fn(),
}));

import api from '../../services/api';

// Test component that uses the auth context
function TestComponent() {
  const { signed, user, loading, signIn, signOut, updateUser } = useAuth();

  return (
    <>
      <Text testID="signed">{signed ? 'signed' : 'not-signed'}</Text>
      <Text testID="loading">{loading ? 'loading' : 'not-loading'}</Text>
      <Text testID="user">{user ? JSON.stringify(user) : 'no-user'}</Text>
      <TouchableOpacity
        testID="sign-in"
        onPress={() => signIn('test@email.com', 'password')}
      >
        <Text>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="sign-out" onPress={signOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="update-user"
        onPress={() => updateUser({ name: 'Updated Name' })}
      >
        <Text>Update User</Text>
      </TouchableOpacity>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with user not signed in', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('not-signed');
      }, { timeout: 5000 });
    });
  });

  describe('Load Stored Data', () => {
    it('should load user from AsyncStorage', async () => {
      const storedUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        userType: 'customer',
      };

      await AsyncStorage.setItem('user', JSON.stringify(storedUser));
      await AsyncStorage.setItem('token', 'stored-token');

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('signed');
        expect(getByTestId('user').children[0]).toBe(JSON.stringify(storedUser));
      });
    });

    it('should not load user if only token is stored', async () => {
      await AsyncStorage.setItem('token', 'stored-token');

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('not-signed');
      });
    });

    it('should not load user if only user data is stored', async () => {
      const storedUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        userType: 'customer',
      };

      await AsyncStorage.setItem('user', JSON.stringify(storedUser));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('not-signed');
      });
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        userType: 'customer',
      };

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          user: mockUser,
          token: 'test-token',
        },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('not-loading');
      });

      await act(async () => {
        fireEvent.press(getByTestId('sign-in'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@email.com',
          password: 'password',
        });
        expect(getByTestId('signed').children[0]).toBe('signed');
      });

      // Check AsyncStorage was updated
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      expect(JSON.parse(storedUser!)).toEqual(mockUser);
      expect(storedToken).toBe('test-token');
    });

  });

  describe('Sign Out', () => {
    it('should sign out and clear storage', async () => {
      // Setup: pre-load user
      const storedUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        userType: 'customer',
      };

      await AsyncStorage.setItem('user', JSON.stringify(storedUser));
      await AsyncStorage.setItem('token', 'stored-token');

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('signed');
      });

      // Sign out
      await act(async () => {
        fireEvent.press(getByTestId('sign-out'));
      });

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('not-signed');
        expect(getByTestId('user').children[0]).toBe('no-user');
      });
    });
  });

  describe('Update User', () => {
    it('should update user profile', async () => {
      // Setup: pre-load user
      const storedUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        userType: 'customer',
      };

      await AsyncStorage.setItem('user', JSON.stringify(storedUser));
      await AsyncStorage.setItem('token', 'stored-token');

      (api.put as jest.Mock).mockResolvedValueOnce({
        data: { name: 'Updated Name' },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('signed').children[0]).toBe('signed');
      });

      // Update user
      await act(async () => {
        fireEvent.press(getByTestId('update-user'));
      });

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/profile', { name: 'Updated Name' });
      });

      // Verify storage was updated
      const updatedStoredUser = await AsyncStorage.getItem('user');
      expect(JSON.parse(updatedStoredUser!).name).toBe('Updated Name');
    });
  });
});
