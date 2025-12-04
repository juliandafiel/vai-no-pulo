import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { getFullImageUrl } from '../services/api';

interface SavedObject {
    id: string;
    name: string;
    description?: string;
    category: string;
    subcategory: string;
    brand?: string;
    declaredValue?: number;
    isFragile: boolean;
    requiresRefrigeration: boolean;
    requiresBox?: boolean;
    requiresSpecialCare?: boolean;
    needsDriverBox?: boolean;
    photos: string[];
    videos?: string[];
    weight?: number;
    height?: number;
    width?: number;
    depth?: number;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES: Record<string, { label: string; icon: string }> = {
    electronics: { label: 'Eletrônicos', icon: 'phone-portrait-outline' },
    clothes: { label: 'Roupas e Calçados', icon: 'shirt-outline' },
    home: { label: 'Cama, Mesa e Banho', icon: 'bed-outline' },
    food: { label: 'Alimentos', icon: 'fast-food-outline' },
    furniture: { label: 'Móveis', icon: 'home-outline' },
    documents: { label: 'Documentos', icon: 'document-text-outline' },
    other: { label: 'Outros', icon: 'cube-outline' },
};

export default function ObjectsScreen() {
    const navigation = useNavigation<any>();
    const [objects, setObjects] = useState<SavedObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedObject, setSelectedObject] = useState<SavedObject | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Seleção múltipla para pacote
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());

    const loadObjects = useCallback(async () => {
        try {
            console.log('[ObjectsScreen] Carregando objetos...');
            const response = await api.get('/objects');
            console.log('[ObjectsScreen] Objetos carregados:', response.data?.length || 0);
            setObjects(response.data || []);
        } catch (error: any) {
            console.log('[ObjectsScreen] Erro ao carregar objetos:', error?.response?.status, error?.message);
            // Se o endpoint não existir ainda ou retornar erro, usa dados vazios
            if (error?.response?.status === 404 || error?.response?.status === 500) {
                setObjects([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            console.log('[ObjectsScreen] Tela ganhou foco, recarregando...');
            // Força um pequeno delay para garantir que o backend processou
            const timer = setTimeout(() => {
                loadObjects();
            }, 100);
            return () => clearTimeout(timer);
        }, [loadObjects])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadObjects();
    };

    const handleAddObject = () => {
        navigation.navigate('AddObject');
    };

    const handleObjectPress = (object: SavedObject) => {
        if (selectionMode) {
            toggleObjectSelection(object.id);
        } else {
            setSelectedObject(object);
            setShowDetailsModal(true);
        }
    };

    const handleObjectLongPress = (object: SavedObject) => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedObjects(new Set([object.id]));
        }
    };

    const toggleObjectSelection = (objectId: string) => {
        const newSelection = new Set(selectedObjects);
        if (newSelection.has(objectId)) {
            newSelection.delete(objectId);
            if (newSelection.size === 0) {
                setSelectionMode(false);
            }
        } else {
            newSelection.add(objectId);
        }
        setSelectedObjects(newSelection);
    };

    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedObjects(new Set());
    };

    const handleCreatePackage = () => {
        const selectedItems = objects.filter(obj => selectedObjects.has(obj.id));
        navigation.navigate('SearchTrip', { packageObjects: selectedItems });
        cancelSelection();
    };

    const handleDeleteObject = (object: SavedObject) => {
        Alert.alert(
            'Excluir Objeto',
            `Tem certeza que deseja excluir "${object.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await api.delete(`/objects/${object.id}`);
                            setObjects(objects.filter(o => o.id !== object.id));
                            setShowDetailsModal(false);
                            Alert.alert('Sucesso', 'Objeto excluído com sucesso');
                        } catch (error) {
                            console.log('Erro ao excluir objeto:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o objeto');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleUseObject = (object: SavedObject) => {
        setShowDetailsModal(false);
        navigation.navigate('SearchTrip', { savedObject: object });
    };

    const handleEditObject = (object: SavedObject) => {
        setShowDetailsModal(false);
        navigation.navigate('AddObject', { editObject: object });
    };

    const getCategoryInfo = (categoryId: string) => {
        return CATEGORIES[categoryId] || { label: categoryId, icon: 'cube-outline' };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum objeto cadastrado</Text>
            <Text style={styles.emptyText}>
                Cadastre seus objetos para agilizar o envio de mercadorias
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddObject}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Cadastrar Objeto</Text>
            </TouchableOpacity>
        </View>
    );

    const renderObjectItem = ({ item }: { item: SavedObject }) => {
        const category = getCategoryInfo(item.category);
        const firstPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
        const isSelected = selectedObjects.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.objectCard, isSelected && styles.objectCardSelected]}
                onPress={() => handleObjectPress(item)}
                onLongPress={() => handleObjectLongPress(item)}
                activeOpacity={0.7}
            >
                {selectionMode && (
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                )}

                <View style={styles.objectImageContainer}>
                    {firstPhoto ? (
                        <Image
                            source={{ uri: getFullImageUrl(firstPhoto) || '' }}
                            style={styles.objectImage}
                        />
                    ) : (
                        <View style={styles.objectImagePlaceholder}>
                            <Ionicons name={category.icon as any} size={30} color="#999" />
                        </View>
                    )}
                </View>

                <View style={styles.objectInfo}>
                    <Text style={styles.objectName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.objectCategory}>
                        <Ionicons name={category.icon as any} size={14} color="#4facfe" />
                        <Text style={styles.objectCategoryText}>{category.label}</Text>
                    </View>
                    {item.declaredValue && (
                        <Text style={styles.objectValue}>
                            R$ {item.declaredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Text>
                    )}
                    <View style={styles.objectTags}>
                        {item.isFragile && (
                            <View style={[styles.tag, styles.tagFragile]}>
                                <Ionicons name="alert-circle" size={12} color="#ff6b6b" />
                                <Text style={[styles.tagText, { color: '#ff6b6b' }]}>Frágil</Text>
                            </View>
                        )}
                        {item.requiresRefrigeration && (
                            <View style={[styles.tag, styles.tagCold]}>
                                <Ionicons name="snow" size={12} color="#4facfe" />
                                <Text style={[styles.tagText, { color: '#4facfe' }]}>Refrigerado</Text>
                            </View>
                        )}
                    </View>
                </View>

                {!selectionMode && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
            </TouchableOpacity>
        );
    };

    const renderDetailsModal = () => {
        if (!selectedObject) return null;
        const category = getCategoryInfo(selectedObject.category);

        return (
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalhes do Objeto</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Fotos */}
                            {selectedObject.photos && selectedObject.photos.length > 0 && (
                                <FlatList
                                    horizontal
                                    data={selectedObject.photos}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <Image
                                            source={{ uri: getFullImageUrl(item) || '' }}
                                            style={styles.modalPhoto}
                                        />
                                    )}
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.modalPhotos}
                                />
                            )}

                            <Text style={styles.modalObjectName}>{selectedObject.name}</Text>

                            {selectedObject.description && (
                                <Text style={styles.modalDescription}>{selectedObject.description}</Text>
                            )}

                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}>
                                    <Ionicons name={category.icon as any} size={18} color="#4facfe" />
                                    <Text style={styles.modalLabel}>Categoria:</Text>
                                    <Text style={styles.modalValue}>{category.label}</Text>
                                </View>

                                {selectedObject.brand && (
                                    <View style={styles.modalRow}>
                                        <Ionicons name="pricetag-outline" size={18} color="#4facfe" />
                                        <Text style={styles.modalLabel}>Marca:</Text>
                                        <Text style={styles.modalValue}>{selectedObject.brand}</Text>
                                    </View>
                                )}

                                {selectedObject.declaredValue && (
                                    <View style={styles.modalRow}>
                                        <Ionicons name="cash-outline" size={18} color="#4facfe" />
                                        <Text style={styles.modalLabel}>Valor:</Text>
                                        <Text style={styles.modalValue}>
                                            R$ {selectedObject.declaredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.modalTags}>
                                {selectedObject.isFragile && (
                                    <View style={[styles.modalTag, { backgroundColor: '#fff0f0' }]}>
                                        <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                                        <Text style={[styles.modalTagText, { color: '#ff6b6b' }]}>Frágil</Text>
                                    </View>
                                )}
                                {selectedObject.requiresRefrigeration && (
                                    <View style={[styles.modalTag, { backgroundColor: '#e8f4fe' }]}>
                                        <Ionicons name="snow" size={16} color="#4facfe" />
                                        <Text style={[styles.modalTagText, { color: '#4facfe' }]}>Refrigerado</Text>
                                    </View>
                                )}
                                {(selectedObject.requiresSpecialCare || selectedObject.requiresBox) && (
                                    <View style={[styles.modalTag, { backgroundColor: '#f0f0f0' }]}>
                                        <Ionicons name="cube" size={16} color="#666" />
                                        <Text style={[styles.modalTagText, { color: '#666' }]}>Em caixa</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.modalDate}>
                                Cadastrado em {formatDate(selectedObject.createdAt)}
                            </Text>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteObject(selectedObject)}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color="#ff6b6b" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                                        <Text style={styles.deleteButtonText}>Excluir</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditObject(selectedObject)}
                            >
                                <Ionicons name="create-outline" size={18} color="#4facfe" />
                                <Text style={styles.editButtonText}>Editar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.useButton}
                                onPress={() => handleUseObject(selectedObject)}
                            >
                                <Ionicons name="send-outline" size={18} color="#fff" />
                                <Text style={styles.useButtonText}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4facfe" />
                    <Text style={styles.loadingText}>Carregando objetos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                {selectionMode ? (
                    <>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelSelection}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>
                                {selectedObjects.size} {selectedObjects.size === 1 ? 'selecionado' : 'selecionados'}
                            </Text>
                            <Text style={styles.headerSubtitle}>Segure para selecionar mais</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.selectAllButton, selectedObjects.size === objects.length && styles.selectAllButtonActive]}
                            onPress={() => {
                                if (selectedObjects.size === objects.length) {
                                    setSelectedObjects(new Set());
                                    setSelectionMode(false);
                                } else {
                                    setSelectedObjects(new Set(objects.map(o => o.id)));
                                }
                            }}
                        >
                            <Ionicons
                                name={selectedObjects.size === objects.length ? 'checkbox' : 'checkbox-outline'}
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Meus Objetos</Text>
                            <Text style={styles.headerSubtitle}>
                                {objects.length} {objects.length === 1 ? 'objeto cadastrado' : 'objetos cadastrados'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddObject}>
                            <Ionicons name="add" size={28} color="#4facfe" />
                        </TouchableOpacity>
                    </>
                )}
            </LinearGradient>

            {/* Lista de objetos */}
            {objects.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={objects}
                    keyExtractor={(item) => item.id}
                    renderItem={renderObjectItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4facfe']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB para adicionar ou barra de pacote */}
            {selectionMode && selectedObjects.size > 0 ? (
                <View style={styles.packageBar}>
                    <View style={styles.packageInfo}>
                        <Ionicons name="cube" size={24} color="#4facfe" />
                        <Text style={styles.packageInfoText}>
                            {selectedObjects.size} {selectedObjects.size === 1 ? 'objeto' : 'objetos'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.packageButton} onPress={handleCreatePackage}>
                        <LinearGradient
                            colors={['#4facfe', '#00f2fe']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.packageButtonGradient}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                            <Text style={styles.packageButtonText}>Enviar Pacote</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : objects.length > 0 ? (
                <TouchableOpacity style={styles.fab} onPress={handleAddObject}>
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            ) : null}

            {/* Modal de detalhes */}
            {renderDetailsModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 25,
        paddingTop: 15,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectAllButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectAllButtonActive: {
        opacity: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    objectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    objectCardSelected: {
        backgroundColor: '#e8f4fe',
        borderWidth: 2,
        borderColor: '#4facfe',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    objectImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
    },
    objectImage: {
        width: '100%',
        height: '100%',
    },
    objectImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    objectInfo: {
        flex: 1,
    },
    objectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    objectCategory: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    objectCategoryText: {
        fontSize: 13,
        color: '#4facfe',
    },
    objectValue: {
        fontSize: 13,
        color: '#27ae60',
        fontWeight: '600',
        marginBottom: 4,
    },
    objectTags: {
        flexDirection: 'row',
        gap: 6,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    tagFragile: {
        backgroundColor: '#fff0f0',
    },
    tagCold: {
        backgroundColor: '#e8f4fe',
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 90,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageBar: {
        position: 'absolute',
        bottom: 90,
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    packageInfoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    packageButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    packageButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    packageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    modalPhotos: {
        marginBottom: 16,
    },
    modalPhoto: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 10,
    },
    modalObjectName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    modalSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        width: 90,
    },
    modalValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    modalTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    modalTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    modalTagText: {
        fontSize: 13,
        fontWeight: '500',
    },
    modalDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ff6b6b',
        gap: 6,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ff6b6b',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4facfe',
        gap: 6,
    },
    editButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4facfe',
    },
    useButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    useButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
