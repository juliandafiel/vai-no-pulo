import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    SafeAreaView,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
    showLabel?: boolean;
}

export default function LanguageSelector({ showLabel = true }: LanguageSelectorProps) {
    const { language, languageInfo, availableLanguages, setLanguage, t } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectLanguage = async (code: string) => {
        await setLanguage(code);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.flag}>{languageInfo.flag}</Text>
                {showLabel && (
                    <Text style={styles.languageName}>{languageInfo.name}</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={availableLanguages}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.languageItem,
                                        item.code === language && styles.languageItemSelected,
                                    ]}
                                    onPress={() => handleSelectLanguage(item.code)}
                                >
                                    <Text style={styles.languageFlag}>{item.flag}</Text>
                                    <Text
                                        style={[
                                            styles.languageText,
                                            item.code === language && styles.languageTextSelected,
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    {item.code === language && (
                                        <Ionicons name="checkmark" size={20} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    flag: {
        fontSize: 18,
        marginRight: 6,
    },
    languageName: {
        fontSize: 14,
        color: '#333',
        marginRight: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    languageItemSelected: {
        backgroundColor: '#f0f7ff',
    },
    languageFlag: {
        fontSize: 24,
        marginRight: 15,
    },
    languageText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    languageTextSelected: {
        color: '#4facfe',
        fontWeight: '600',
    },
});
