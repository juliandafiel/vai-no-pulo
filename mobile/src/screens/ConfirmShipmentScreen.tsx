import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api, { getFullImageUrl } from '../services/api';

export default function ConfirmShipmentScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { trip, searchParams, merchandise, insurance, pricing } = route.params || {};
    const [loading, setLoading] = useState(false);

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
        });
    }

    function formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getCategoryLabel(categoryId: string): string {
        const categories: Record<string, string> = {
            electronics: 'Eletronicos',
            clothes: 'Roupas',
            documents: 'Documentos',
            food: 'Alimentos',
            furniture: 'Moveis',
            other: 'Outros',
        };
        return categories[categoryId] || categoryId;
    }

    async function handleConfirm() {
        Alert.alert(
            'Confirmar Envio',
            'Deseja confirmar a solicitacao de envio? O motorista sera notificado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: confirmShipment,
                },
            ]
        );
    }

    async function confirmShipment() {
        setLoading(true);
        try {
            // Formatar dimensões
            const dimensions = `${merchandise.height}x${merchandise.width}x${merchandise.length}cm`;

            // Montar descrição completa
            let description = merchandise.name;
            if (merchandise.description) {
                description += ` - ${merchandise.description}`;
            }
            if (merchandise.isFragile) {
                description += ' [FRÁGIL]';
            }
            if (merchandise.requiresRefrigeration) {
                description += ' [REFRIGERADO]';
            }

            // Criar o pedido usando /orders (que suporta mensagens)
            const orderResponse = await api.post('/orders', {
                tripId: trip.id,
                description: description,
                weight: parseFloat(merchandise.weight),
                dimensions: dimensions,
                estimatedPrice: pricing?.totalPrice || 0,
                notes: merchandise.specialInstructions || undefined,
            });

            // Obter o ID do pedido criado
            const orderId = orderResponse.data?.id;

            // Enviar mensagem inicial ao motorista
            if (orderId) {
                try {
                    const mensagemInicial = `Olá! Gostaria de enviar uma mercadoria (${merchandise.name}) na sua viagem de ${searchParams.originCity} para ${searchParams.destinationCity}. Você pode aceitar minha solicitação?`;

                    await api.post('/messages', {
                        orderId: orderId,
                        content: mensagemInicial,
                    });
                    console.log('[ConfirmShipment] Mensagem inicial enviada com sucesso');
                } catch (msgError) {
                    console.log('[ConfirmShipment] Erro ao enviar mensagem inicial:', msgError);
                    // Não bloqueia o fluxo se a mensagem falhar
                }
            }

            Alert.alert(
                'Sucesso!',
                'Sua solicitação foi enviada e uma conversa foi iniciada com o motorista. Acompanhe pelo menu Mensagens.',
                [
                    {
                        text: 'Ver Mensagens',
                        onPress: () => navigation.navigate('Mensagens'),
                    },
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('TripsMain'),
                    },
                ]
            );
        } catch (error: any) {
            console.log('[ConfirmShipment] Erro:', error?.response?.data || error?.message);
            Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel enviar a solicitacao. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar Envio</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* MOTORISTA */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={22} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Motorista</Text>
                    </View>

                    <View style={styles.driverCard}>
                        {trip?.driver?.profilePhoto ? (
                            <Image
                                source={{ uri: getFullImageUrl(trip.driver.profilePhoto) || undefined }}
                                style={styles.driverPhoto}
                            />
                        ) : (
                            <View style={styles.driverPhotoPlaceholder}>
                                <Ionicons name="person" size={30} color="#666" />
                            </View>
                        )}
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{trip?.driver?.name}</Text>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={styles.ratingText}>
                                    {trip?.driver?.rating?.toFixed(1)} ({trip?.driver?.totalTrips} viagens)
                                </Text>
                            </View>
                            <Text style={styles.vehicleInfo}>
                                {trip?.driver?.vehicle?.brand} {trip?.driver?.vehicle?.model}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* TRAJETO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="navigate-outline" size={22} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Trajeto</Text>
                    </View>

                    <Text style={styles.dateText}>
                        {formatDate(searchParams?.date || new Date().toISOString())}
                    </Text>

                    <View style={styles.routeContainer}>
                        <View style={styles.routePoint}>
                            <View style={styles.originDot} />
                            <View style={styles.routeInfo}>
                                <Text style={styles.routeCity}>{searchParams?.originCity}</Text>
                                <Text style={styles.routeAddress}>{searchParams?.origin}</Text>
                                <Text style={styles.routeTime}>
                                    Coleta: {formatTime(trip?.departureTime || new Date().toISOString())}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.routeDashedLine} />

                        <View style={styles.routePoint}>
                            <View style={styles.destinationDot} />
                            <View style={styles.routeInfo}>
                                <Text style={styles.routeCity}>
                                    {searchParams?.destinationCity}
                                </Text>
                                <Text style={styles.routeAddress}>
                                    {searchParams?.destination}
                                </Text>
                                <Text style={styles.routeTime}>
                                    Entrega: {formatTime(trip?.estimatedArrival || new Date().toISOString())}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* MERCADORIA */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cube-outline" size={22} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Mercadoria</Text>
                    </View>

                    <View style={styles.merchandiseInfo}>
                        <Text style={styles.merchandiseName}>{merchandise?.name}</Text>
                        {merchandise?.description && (
                            <Text style={styles.merchandiseDescription}>
                                {merchandise.description}
                            </Text>
                        )}
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Ionicons name="pricetag-outline" size={18} color="#666" />
                            <Text style={styles.detailLabel}>Categoria</Text>
                            <Text style={styles.detailValue}>
                                {getCategoryLabel(merchandise?.category)}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="scale-outline" size={18} color="#666" />
                            <Text style={styles.detailLabel}>Peso</Text>
                            <Text style={styles.detailValue}>{merchandise?.weight} kg</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="resize-outline" size={18} color="#666" />
                            <Text style={styles.detailLabel}>Dimensoes</Text>
                            <Text style={styles.detailValue}>
                                {merchandise?.height}x{merchandise?.width}x{merchandise?.length} cm
                            </Text>
                        </View>
                    </View>

                    {(merchandise?.isFragile || merchandise?.requiresRefrigeration) && (
                        <View style={styles.tagsContainer}>
                            {merchandise?.isFragile && (
                                <View style={[styles.tag, styles.tagFragile]}>
                                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                    <Text style={styles.tagTextFragile}>Fragil</Text>
                                </View>
                            )}
                            {merchandise?.requiresRefrigeration && (
                                <View style={[styles.tag, styles.tagCold]}>
                                    <Ionicons name="snow" size={14} color="#4facfe" />
                                    <Text style={styles.tagTextCold}>Refrigerado</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {merchandise?.photos?.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.photosContainer}
                        >
                            {merchandise.photos.map((photo: string, index: number) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    style={styles.merchandisePhoto}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* SEGURO */}
                {insurance && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={22} color="#00f260" />
                            <Text style={styles.sectionTitle}>Seguro Contratado</Text>
                        </View>

                        <View style={styles.insuranceCard}>
                            <View style={styles.insuranceInfo}>
                                <Text style={styles.insuranceTitle}>Seguro de Carga</Text>
                                <Text style={styles.insuranceDetail}>
                                    Valor declarado: R$ {parseFloat(merchandise?.declaredValue || 0).toFixed(2)}
                                </Text>
                            </View>
                            <Text style={styles.insurancePrice}>
                                R$ {insurance.price.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* RESUMO FINANCEIRO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="receipt-outline" size={22} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Resumo do Pagamento</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Frete ({merchandise?.weight} kg)</Text>
                        <Text style={styles.priceValue}>
                            R$ {pricing?.basePrice?.toFixed(2)}
                        </Text>
                    </View>

                    {insurance && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Seguro</Text>
                            <Text style={styles.priceValue}>
                                R$ {pricing?.insurancePrice?.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>
                            R$ {pricing?.totalPrice?.toFixed(2)}
                        </Text>
                    </View>

                    <Text style={styles.paymentNote}>
                        O pagamento sera processado apos a confirmacao do motorista
                    </Text>
                </View>

                {/* TERMOS */}
                <View style={styles.termsContainer}>
                    <Ionicons name="information-circle-outline" size={18} color="#666" />
                    <Text style={styles.termsText}>
                        Ao confirmar, voce concorda com os Termos de Servico e Politica de
                        Privacidade. O motorista tem ate 2 horas para aceitar sua
                        solicitacao.
                    </Text>
                </View>

                {/* BOTOES */}
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirmar Envio</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Voltar e Editar</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    driverPhotoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverInfo: {
        marginLeft: 15,
        flex: 1,
    },
    driverName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 5,
    },
    vehicleInfo: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#4facfe',
        fontWeight: '600',
        textTransform: 'capitalize',
        marginBottom: 15,
    },
    routeContainer: {
        marginTop: 5,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    originDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4facfe',
        marginTop: 3,
        marginRight: 12,
    },
    destinationDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00f260',
        marginTop: 3,
        marginRight: 12,
    },
    routeDashedLine: {
        width: 2,
        height: 30,
        backgroundColor: '#ddd',
        marginLeft: 6,
        marginVertical: 5,
    },
    routeInfo: {
        flex: 1,
    },
    routeCity: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    routeAddress: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    routeTime: {
        fontSize: 12,
        color: '#4facfe',
        fontWeight: '500',
        marginTop: 4,
    },
    merchandiseInfo: {
        marginBottom: 15,
    },
    merchandiseName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    merchandiseDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 5,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginTop: 2,
        textAlign: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 10,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagFragile: {
        backgroundColor: '#fff0f0',
    },
    tagCold: {
        backgroundColor: '#e8f4fe',
    },
    tagTextFragile: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ff6b6b',
        marginLeft: 5,
    },
    tagTextCold: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4facfe',
        marginLeft: 5,
    },
    photosContainer: {
        marginTop: 15,
    },
    merchandisePhoto: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 10,
    },
    insuranceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        padding: 15,
        borderRadius: 12,
    },
    insuranceInfo: {
        flex: 1,
    },
    insuranceTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    insuranceDetail: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    insurancePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00f260',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 5,
        paddingTop: 15,
    },
    totalLabel: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00f260',
    },
    paymentNote: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f4f8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    termsText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
        lineHeight: 18,
    },
    confirmButton: {
        backgroundColor: '#00f260',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00f260',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    cancelButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 100,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '500',
    },
});
