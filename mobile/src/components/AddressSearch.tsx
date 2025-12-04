import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { searchAddresses, GeocodingResult } from '../services/mapService';

interface AddressSearchProps {
  placeholder?: string;
  onSelectAddress: (result: GeocodingResult) => void;
  countryCode?: string;
  style?: object;
  inputStyle?: object;
}

export default function AddressSearch({
  placeholder = 'Digite o endereço...',
  onSelectAddress,
  countryCode = 'br',
  style,
  inputStyle,
}: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounce para evitar muitas requisições
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchAddresses(query, countryCode);
        setResults(searchResults);
        setShowResults(searchResults.length > 0);
      } catch (error) {
        console.error('Erro na busca:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, countryCode]);

  const handleSelectAddress = useCallback((result: GeocodingResult) => {
    setQuery(result.displayName.split(',')[0]);
    setShowResults(false);
    Keyboard.dismiss();
    onSelectAddress(result);
  }, [onSelectAddress]);

  const formatAddress = (result: GeocodingResult): string => {
    const parts = [];
    if (result.address.road) parts.push(result.address.road);
    if (result.address.neighbourhood) parts.push(result.address.neighbourhood);
    if (result.address.city) parts.push(result.address.city);
    return parts.join(', ') || result.displayName.substring(0, 50);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            size="small"
            color="#3B82F6"
          />
        )}
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectAddress(item)}
              >
                <Text style={styles.resultTitle}>
                  {item.address.road || item.displayName.split(',')[0]}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {formatAddress(item)}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  loader: {
    marginRight: 12,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
