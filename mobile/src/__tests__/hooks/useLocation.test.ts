// Location hooks tests
import * as Location from 'expo-location';

// Mock expo-location
jest.mock('expo-location');

describe('Location Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestForegroundPermissions', () => {
    it('should request foreground location permissions', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await Location.requestForegroundPermissionsAsync();

      expect(result.status).toBe('granted');
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle denied permissions', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await Location.requestForegroundPermissionsAsync();

      expect(result.status).toBe('denied');
    });
  });

  describe('requestBackgroundPermissions', () => {
    it('should request background location permissions', async () => {
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await Location.requestBackgroundPermissionsAsync();

      expect(result.status).toBe('granted');
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('getCurrentPosition', () => {
    it('should get current position', async () => {
      const mockPosition = {
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: 10,
          altitude: 760,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      };

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockPosition);

      const result = await Location.getCurrentPositionAsync({});

      expect(result.coords.latitude).toBe(-23.5505);
      expect(result.coords.longitude).toBe(-46.6333);
    });

    it('should get position with high accuracy', async () => {
      const mockPosition = {
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: 5,
          altitude: 760,
          altitudeAccuracy: 3,
          heading: 45,
          speed: 10,
        },
        timestamp: Date.now(),
      };

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockPosition);

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      expect(result.coords.accuracy).toBeLessThanOrEqual(5);
    });
  });

  describe('watchPosition', () => {
    it('should start watching position', async () => {
      const mockRemove = jest.fn();
      (Location.watchPositionAsync as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const callback = jest.fn();
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        callback
      );

      expect(Location.watchPositionAsync).toHaveBeenCalled();
      expect(subscription.remove).toBeDefined();

      // Clean up
      subscription.remove();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Accuracy Levels', () => {
    it('should have correct accuracy constants', () => {
      expect(Location.Accuracy.Lowest).toBe(1);
      expect(Location.Accuracy.Low).toBe(2);
      expect(Location.Accuracy.Balanced).toBe(3);
      expect(Location.Accuracy.High).toBe(4);
      expect(Location.Accuracy.Highest).toBe(5);
      expect(Location.Accuracy.BestForNavigation).toBe(6);
    });
  });
});

describe('Location Utils', () => {
  describe('calculateDistance', () => {
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
      return R * c;
    };

    it('should calculate distance between Sao Paulo and Rio', () => {
      const distance = calculateDistance(
        -23.5505, // Sao Paulo
        -46.6333,
        -22.9068, // Rio de Janeiro
        -43.1729
      );

      // Approximately 360km
      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(400);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333);
      expect(distance).toBe(0);
    });
  });

  describe('isInsideGeofence', () => {
    const isInsideGeofence = (
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
      // Point at center
      expect(isInsideGeofence(-23.5505, -46.6333, -23.5505, -46.6333, 1)).toBe(true);

      // Point 500m away with 1km radius
      expect(isInsideGeofence(-23.5545, -46.6333, -23.5505, -46.6333, 1)).toBe(true);
    });

    it('should detect point outside geofence', () => {
      // Point 10km away with 1km radius
      expect(isInsideGeofence(-23.6505, -46.6333, -23.5505, -46.6333, 1)).toBe(false);
    });
  });

  describe('formatCoordinates', () => {
    const formatCoordinates = (lat: number, lon: number): string => {
      const latDir = lat >= 0 ? 'N' : 'S';
      const lonDir = lon >= 0 ? 'E' : 'W';
      return `${Math.abs(lat).toFixed(4)}${latDir}, ${Math.abs(lon).toFixed(4)}${lonDir}`;
    };

    it('should format coordinates correctly', () => {
      expect(formatCoordinates(-23.5505, -46.6333)).toBe('23.5505S, 46.6333W');
      expect(formatCoordinates(40.7128, -74.006)).toBe('40.7128N, 74.0060W');
      expect(formatCoordinates(51.5074, -0.1278)).toBe('51.5074N, 0.1278W');
    });
  });

  describe('calculateETA', () => {
    const calculateETA = (distanceKm: number, speedKmh: number = 40): number => {
      return (distanceKm / speedKmh) * 60; // returns minutes
    };

    it('should calculate ETA in minutes', () => {
      expect(calculateETA(40, 40)).toBe(60); // 40km at 40km/h = 60 minutes
      expect(calculateETA(20, 40)).toBe(30); // 20km at 40km/h = 30 minutes
      expect(calculateETA(60, 60)).toBe(60); // 60km at 60km/h = 60 minutes
    });

    it('should use default speed', () => {
      expect(calculateETA(40)).toBe(60); // default 40km/h
    });
  });

  describe('getBearing', () => {
    const getBearing = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const lat1Rad = (lat1 * Math.PI) / 180;
      const lat2Rad = (lat2 * Math.PI) / 180;

      const y = Math.sin(dLon) * Math.cos(lat2Rad);
      const x =
        Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

      let bearing = (Math.atan2(y, x) * 180) / Math.PI;
      bearing = (bearing + 360) % 360;

      return bearing;
    };

    it('should calculate bearing between two points', () => {
      // Due north
      const bearingNorth = getBearing(-23.5505, -46.6333, -23.0505, -46.6333);
      expect(bearingNorth).toBeCloseTo(0, -1);

      // Due south
      const bearingSouth = getBearing(-23.5505, -46.6333, -24.0505, -46.6333);
      expect(bearingSouth).toBeCloseTo(180, -1);

      // Due east
      const bearingEast = getBearing(-23.5505, -46.6333, -23.5505, -46.1333);
      expect(bearingEast).toBeCloseTo(90, -1);
    });
  });
});
