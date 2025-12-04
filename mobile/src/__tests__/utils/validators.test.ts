// Utility validators tests

describe('Validators', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.com')).toBe(true);
      expect(isValidEmail('user@sub.domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('invalid @domain.com')).toBe(false);
    });
  });

  describe('Phone Validation (Brazilian)', () => {
    const isValidPhone = (phone: string): boolean => {
      // Remove non-digits
      const digits = phone.replace(/\D/g, '');
      // Brazilian phone: 10-11 digits (with DDD)
      return digits.length >= 10 && digits.length <= 11;
    };

    it('should validate correct phone formats', () => {
      expect(isValidPhone('11999999999')).toBe(true);
      expect(isValidPhone('(11) 99999-9999')).toBe(true);
      expect(isValidPhone('11 99999 9999')).toBe(true);
      expect(isValidPhone('1133333333')).toBe(true); // Landline
    });

    it('should reject invalid phone formats', () => {
      expect(isValidPhone('123456789')).toBe(false); // Too short
      expect(isValidPhone('123456789012')).toBe(false); // Too long
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('CPF Validation', () => {
    const isValidCPF = (cpf: string): boolean => {
      const digits = cpf.replace(/\D/g, '');

      if (digits.length !== 11) return false;

      // Check for all same digits
      if (/^(\d)\1+$/.test(digits)) return false;

      // Validate check digits
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i]) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10) remainder = 0;
      if (remainder !== parseInt(digits[9])) return false;

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(digits[i]) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10) remainder = 0;
      if (remainder !== parseInt(digits[10])) return false;

      return true;
    };

    it('should validate correct CPF formats', () => {
      // Using valid CPF numbers (test CPFs)
      expect(isValidCPF('529.982.247-25')).toBe(true);
      expect(isValidCPF('52998224725')).toBe(true);
    });

    it('should reject invalid CPF formats', () => {
      expect(isValidCPF('111.111.111-11')).toBe(false); // All same
      expect(isValidCPF('000.000.000-00')).toBe(false); // All zeros
      expect(isValidCPF('123.456.789-00')).toBe(false); // Invalid check digit
      expect(isValidCPF('12345678')).toBe(false); // Too short
    });
  });

  describe('License Plate Validation (Brazilian)', () => {
    const isValidPlate = (plate: string): boolean => {
      const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Old format: ABC1234 (3 letters + 4 numbers)
      const oldFormat = /^[A-Z]{3}\d{4}$/;

      // Mercosul format: ABC1D23 (3 letters + 1 number + 1 letter + 2 numbers)
      const mercosulFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;

      return oldFormat.test(normalized) || mercosulFormat.test(normalized);
    };

    it('should validate old plate format', () => {
      expect(isValidPlate('ABC1234')).toBe(true);
      expect(isValidPlate('ABC-1234')).toBe(true);
      expect(isValidPlate('abc1234')).toBe(true);
    });

    it('should validate Mercosul plate format', () => {
      expect(isValidPlate('ABC1D23')).toBe(true);
      expect(isValidPlate('ABC-1D23')).toBe(true);
      expect(isValidPlate('abc1d23')).toBe(true);
    });

    it('should reject invalid plate formats', () => {
      expect(isValidPlate('AB12345')).toBe(false);
      expect(isValidPlate('ABCD123')).toBe(false);
      expect(isValidPlate('ABC123')).toBe(false);
      expect(isValidPlate('1234ABC')).toBe(false);
    });
  });

  describe('Password Strength', () => {
    const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
      let score = 0;

      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      if (score <= 2) return 'weak';
      if (score <= 4) return 'medium';
      return 'strong';
    };

    it('should identify weak passwords', () => {
      expect(getPasswordStrength('123456')).toBe('weak');
      expect(getPasswordStrength('password')).toBe('weak');
      expect(getPasswordStrength('abc')).toBe('weak');
    });

    it('should identify medium passwords', () => {
      expect(getPasswordStrength('Password1')).toBe('medium');
      expect(getPasswordStrength('MyPass123')).toBe('medium');
    });

    it('should identify strong passwords', () => {
      expect(getPasswordStrength('MyP@ssw0rd123!')).toBe('strong');
      expect(getPasswordStrength('Str0ng!Pass#2024')).toBe('strong');
    });
  });

  describe('Date Validation', () => {
    const isValidDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    };

    const isFutureDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return date > new Date();
    };

    const isPastDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return date < new Date();
    };

    it('should validate date formats', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-01-15T10:00:00Z')).toBe(true);
      expect(isValidDate('January 15, 2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
    });

    it('should identify future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isFutureDate(futureDate.toISOString())).toBe(true);
    });

    it('should identify past dates', () => {
      expect(isPastDate('2020-01-01')).toBe(true);
    });
  });

  describe('Currency Formatting', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    it('should format currency correctly', () => {
      expect(formatCurrency(25)).toBe('R$\u00A025,00');
      expect(formatCurrency(1234.56)).toBe('R$\u00A01.234,56');
      expect(formatCurrency(0)).toBe('R$\u00A00,00');
    });
  });

  describe('Distance Formatting', () => {
    const formatDistance = (meters: number): string => {
      if (meters < 1000) {
        return `${Math.round(meters)}m`;
      }
      return `${(meters / 1000).toFixed(1)}km`;
    };

    it('should format distance in meters', () => {
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format distance in kilometers', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(1500)).toBe('1.5km');
      expect(formatDistance(10000)).toBe('10.0km');
    });
  });

  describe('Time Formatting', () => {
    const formatDuration = (minutes: number): string => {
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    it('should format duration in minutes', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(59)).toBe('59 min');
    });

    it('should format duration in hours and minutes', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(90)).toBe('1h 30min');
      expect(formatDuration(150)).toBe('2h 30min');
    });
  });
});
