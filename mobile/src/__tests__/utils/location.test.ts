// Location utilities tests

describe('Location Utilities', () => {
  describe('Distance Calculation (Haversine)', () => {
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };

    it('should calculate distance between two points', () => {
      // Sao Paulo to Campinas (approximately 80-90km)
      const distance = calculateDistance(
        -23.5505, // Sao Paulo lat
        -46.6333, // Sao Paulo lon
        -22.9099, // Campinas lat
        -47.0626 // Campinas lon
      );

      expect(distance).toBeGreaterThan(80);
      expect(distance).toBeLessThan(100);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333);
      expect(distance).toBe(0);
    });

    it('should calculate distance for nearby points', () => {
      // Approximately 1km apart
      const distance = calculateDistance(
        -23.5505,
        -46.6333,
        -23.5595, // ~1km south
        -46.6333
      );

      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });
  });

  describe('Coordinate Validation', () => {
    const isValidCoordinate = (lat: number, lon: number): boolean => {
      return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    };

    it('should validate correct coordinates', () => {
      expect(isValidCoordinate(-23.5505, -46.6333)).toBe(true); // Sao Paulo
      expect(isValidCoordinate(40.7128, -74.006)).toBe(true); // New York
      expect(isValidCoordinate(0, 0)).toBe(true); // Null Island
      expect(isValidCoordinate(90, 180)).toBe(true); // Extreme
      expect(isValidCoordinate(-90, -180)).toBe(true); // Extreme
    });

    it('should reject invalid coordinates', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
    });
  });

  describe('Address Formatting', () => {
    const formatAddress = (components: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    }): string => {
      const parts: string[] = [];

      if (components.street) {
        let streetPart = components.street;
        if (components.number) {
          streetPart += `, ${components.number}`;
        }
        parts.push(streetPart);
      }

      if (components.neighborhood) {
        parts.push(components.neighborhood);
      }

      if (components.city) {
        let cityPart = components.city;
        if (components.state) {
          cityPart += ` - ${components.state}`;
        }
        parts.push(cityPart);
      }

      if (components.zipCode) {
        parts.push(components.zipCode);
      }

      return parts.join(', ');
    };

    it('should format complete address', () => {
      const address = formatAddress({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01234-567',
      });

      expect(address).toBe('Rua das Flores, 123, Centro, Sao Paulo - SP, 01234-567');
    });

    it('should format partial address', () => {
      const address = formatAddress({
        street: 'Av. Paulista',
        city: 'Sao Paulo',
        state: 'SP',
      });

      expect(address).toBe('Av. Paulista, Sao Paulo - SP');
    });

    it('should handle empty address', () => {
      const address = formatAddress({});
      expect(address).toBe('');
    });
  });

  describe('Route Optimization', () => {
    interface Point {
      lat: number;
      lon: number;
    }

    const calculateTotalDistance = (points: Point[]): number => {
      if (points.length < 2) return 0;

      let total = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const R = 6371;
        const dLat = ((points[i + 1].lat - points[i].lat) * Math.PI) / 180;
        const dLon = ((points[i + 1].lon - points[i].lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((points[i].lat * Math.PI) / 180) *
            Math.cos((points[i + 1].lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        total += R * c;
      }
      return total;
    };

    it('should calculate total route distance', () => {
      const points: Point[] = [
        { lat: -23.5505, lon: -46.6333 }, // Point A
        { lat: -23.5605, lon: -46.6433 }, // Point B
        { lat: -23.5705, lon: -46.6533 }, // Point C
      ];

      const distance = calculateTotalDistance(points);
      expect(distance).toBeGreaterThan(0);
    });

    it('should return 0 for single point', () => {
      const points: Point[] = [{ lat: -23.5505, lon: -46.6333 }];
      expect(calculateTotalDistance(points)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalDistance([])).toBe(0);
    });
  });

  describe('ETA Calculation', () => {
    const calculateETA = (distanceKm: number, speedKmh: number = 40): Date => {
      const hours = distanceKm / speedKmh;
      const eta = new Date();
      eta.setTime(eta.getTime() + hours * 60 * 60 * 1000);
      return eta;
    };

    const formatETA = (eta: Date): string => {
      return eta.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    it('should calculate ETA for given distance', () => {
      const now = new Date();
      const eta = calculateETA(40); // 40km at 40km/h = 1 hour

      const diffMs = eta.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      expect(diffMinutes).toBeGreaterThan(55);
      expect(diffMinutes).toBeLessThan(65);
    });

    it('should format ETA correctly', () => {
      const eta = new Date('2024-01-15T14:30:00');
      const formatted = formatETA(eta);

      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Geofencing', () => {
    const isInsideCircle = (
      pointLat: number,
      pointLon: number,
      centerLat: number,
      centerLon: number,
      radiusKm: number
    ): boolean => {
      const R = 6371;
      const dLat = ((pointLat - centerLat) * Math.PI) / 180;
      const dLon = ((pointLon - centerLon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((centerLat * Math.PI) / 180) *
          Math.cos((pointLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= radiusKm;
    };

    it('should detect point inside geofence', () => {
      // Point very close to center
      expect(
        isInsideCircle(-23.5505, -46.6333, -23.5505, -46.6333, 1)
      ).toBe(true);

      // Point 0.5km away with 1km radius
      expect(
        isInsideCircle(-23.5545, -46.6333, -23.5505, -46.6333, 1)
      ).toBe(true);
    });

    it('should detect point outside geofence', () => {
      // Point ~100km away with 10km radius
      expect(
        isInsideCircle(-22.9099, -47.0626, -23.5505, -46.6333, 10)
      ).toBe(false);
    });
  });
});
