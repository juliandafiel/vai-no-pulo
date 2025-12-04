import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    profilePhoto: string | null;
}

interface Vehicle {
    id: string;
    plate: string;
    model: string;
    brand: string | null;
    year: string | null;
    color: string | null;
    capacityKg: number;
    capacityM3: number;
    vehiclePhoto: string | null;
    documents: any;
}

interface VehicleChangeRequest {
    id: string;
    vehicleId: string;
    driverId: string;
    newPlate: string | null;
    newModel: string | null;
    newBrand: string | null;
    newYear: string | null;
    newColor: string | null;
    newCapacityKg: number | null;
    newCapacityM3: number | null;
    newDocuments: any;
    newVehiclePhoto: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    vehicle: Vehicle;
    driver: Driver;
}

export default function VehicleChangeRequests() {
    const [requests, setRequests] = useState<VehicleChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
    const [selectedRequest, setSelectedRequest] = useState<VehicleChangeRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
    const [adminMessage, setAdminMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [filter]);

    async function loadRequests() {
        setLoading(true);
        try {
            const url = filter === 'ALL'
                ? '/vehicle-change-requests'
                : `/vehicle-change-requests?status=${filter}`;
            const response = await api.get(url);
            setRequests(response.data);
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
        } finally {
            setLoading(false);
        }
    }

    function openModal(request: VehicleChangeRequest, action: 'approve' | 'reject') {
        setSelectedRequest(request);
        setModalAction(action);
        setAdminMessage('');
        setShowModal(true);
    }

    async function handleConfirmAction() {
        if (!selectedRequest) return;

        if (modalAction === 'reject' && !adminMessage.trim()) {
            alert('Por favor, informe o motivo da rejeição');
            return;
        }

        setProcessing(true);
        try {
            if (modalAction === 'approve') {
                await api.patch(`/vehicle-change-requests/${selectedRequest.id}/approve`, {
                    message: adminMessage.trim() || null,
                });
                alert('Solicitação aprovada com sucesso! O motorista será notificado por email.');
            } else {
                await api.patch(`/vehicle-change-requests/${selectedRequest.id}/reject`, {
                    rejectionReason: adminMessage.trim(),
                });
                alert('Solicitação rejeitada. O motorista será notificado por email.');
            }
            setShowModal(false);
            setSelectedRequest(null);
            setAdminMessage('');
            loadRequests();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao processar solicitação');
        } finally {
            setProcessing(false);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getStatusBadge(status: string) {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
        };
        const badge = badges[status] || badges.PENDING;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    }

    function renderChanges(request: VehicleChangeRequest) {
        const changes: { field: string; old: string; new: string }[] = [];

        if (request.newPlate && request.newPlate !== request.vehicle.plate) {
            changes.push({ field: 'Placa', old: request.vehicle.plate, new: request.newPlate });
        }
        if (request.newModel && request.newModel !== request.vehicle.model) {
            changes.push({ field: 'Modelo', old: request.vehicle.model, new: request.newModel });
        }
        if (request.newBrand && request.newBrand !== request.vehicle.brand) {
            changes.push({ field: 'Marca', old: request.vehicle.brand || '-', new: request.newBrand });
        }
        if (request.newYear && request.newYear !== request.vehicle.year) {
            changes.push({ field: 'Ano', old: request.vehicle.year || '-', new: request.newYear });
        }
        if (request.newColor && request.newColor !== request.vehicle.color) {
            changes.push({ field: 'Cor', old: request.vehicle.color || '-', new: request.newColor });
        }
        if (request.newCapacityKg !== null && request.newCapacityKg !== request.vehicle.capacityKg) {
            changes.push({ field: 'Capacidade (kg)', old: String(request.vehicle.capacityKg), new: String(request.newCapacityKg) });
        }
        if (request.newCapacityM3 !== null && request.newCapacityM3 !== request.vehicle.capacityM3) {
            changes.push({ field: 'Capacidade (m³)', old: String(request.vehicle.capacityM3), new: String(request.newCapacityM3) });
        }
        if (request.newVehiclePhoto && request.newVehiclePhoto !== request.vehicle.vehiclePhoto) {
            changes.push({ field: 'Foto do Veículo', old: 'Foto anterior', new: 'Nova foto' });
        }
        if (request.newDocuments) {
            changes.push({ field: 'Documentos', old: 'Documentos anteriores', new: 'Novos documentos' });
        }

        return changes;
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Alterações de Veículo
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie as solicitações de alteração de veículos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {status === 'ALL' ? 'Todas' :
                             status === 'PENDING' ? 'Pendentes' :
                             status === 'APPROVED' ? 'Aprovadas' : 'Rejeitadas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div>
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-medium text-gray-600">Nenhuma solicitação encontrada</h3>
                        <p className="text-gray-500 mt-2">
                            {filter === 'PENDING'
                                ? 'Não há solicitações pendentes no momento'
                                : 'Nenhuma solicitação nesta categoria'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {requests.map((request) => {
                            const changes = renderChanges(request);
                            return (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                {request.driver.profilePhoto ? (
                                                    <img
                                                        src={request.driver.profilePhoto}
                                                        alt={request.driver.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                                                        {request.driver.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="text-white">
                                                    <h3 className="font-semibold text-lg">{request.driver.name}</h3>
                                                    <p className="text-white/80 text-sm">{request.driver.email}</p>
                                                </div>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        {/* Vehicle Info */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Veículo Atual</h4>
                                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                                {request.vehicle.vehiclePhoto ? (
                                                    <img
                                                        src={request.vehicle.vehiclePhoto}
                                                        alt="Veículo"
                                                        className="w-24 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-3xl">
                                                        🚗
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {request.vehicle.brand} {request.vehicle.model}
                                                    </p>
                                                    <p className="text-gray-600">Placa: {request.vehicle.plate}</p>
                                                    <p className="text-gray-500 text-sm">
                                                        {request.vehicle.year} • {request.vehicle.color}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Changes Table */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Alterações Solicitadas</h4>
                                            {changes.length > 0 ? (
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-gray-50">
                                                            <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Campo</th>
                                                            <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Valor Atual</th>
                                                            <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Novo Valor</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {changes.map((change, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100">
                                                                <td className="px-4 py-3 font-medium text-gray-800">{change.field}</td>
                                                                <td className="px-4 py-3 text-gray-500 line-through">{change.old}</td>
                                                                <td className="px-4 py-3 text-green-600 font-medium">{change.new}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-gray-500 italic">Nenhuma alteração de dados identificada</p>
                                            )}
                                        </div>

                                        {/* New Photo Preview */}
                                        {request.newVehiclePhoto && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Nova Foto do Veículo</h4>
                                                <img
                                                    src={request.newVehiclePhoto}
                                                    alt="Nova foto do veículo"
                                                    className="w-full max-w-md h-48 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}

                                        {/* Meta Info */}
                                        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                                            <span>Solicitado em: {formatDate(request.createdAt)}</span>
                                            {request.reviewedAt && (
                                                <span>
                                                    {request.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'} em: {formatDate(request.reviewedAt)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rejection Reason */}
                                        {request.status === 'REJECTED' && request.rejectionReason && (
                                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <h4 className="text-sm font-medium text-red-800 mb-1">Motivo da Rejeição</h4>
                                                <p className="text-red-700">{request.rejectionReason}</p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {request.status === 'PENDING' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => openModal(request, 'approve')}
                                                    disabled={processing}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    ✓ Aprovar Alteração
                                                </button>
                                                <button
                                                    onClick={() => openModal(request, 'reject')}
                                                    disabled={processing}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    ✕ Rejeitar Alteração
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className={`p-6 border-b border-gray-100 ${modalAction === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className={`text-xl font-semibold ${modalAction === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                                {modalAction === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                            </h3>
                            <p className="text-gray-600 mt-1">
                                {modalAction === 'approve'
                                    ? 'Confirme a aprovação. Você pode adicionar uma mensagem opcional para o motorista.'
                                    : 'Informe o motivo da rejeição. Esta mensagem será enviada por email ao motorista.'}
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {modalAction === 'approve' ? 'Mensagem (opcional)' : 'Motivo da Rejeição *'}
                                </label>
                                <textarea
                                    value={adminMessage}
                                    onChange={(e) => setAdminMessage(e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 resize-none ${
                                        modalAction === 'approve'
                                            ? 'focus:ring-green-500 focus:border-green-500'
                                            : 'focus:ring-red-500 focus:border-red-500'
                                    }`}
                                    placeholder={modalAction === 'approve'
                                        ? 'Adicione uma mensagem para o motorista (opcional)...'
                                        : 'Descreva o motivo da rejeição...'}
                                />
                            </div>
                            <div className={`${modalAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                                <p className={`${modalAction === 'approve' ? 'text-green-800' : 'text-yellow-800'} text-sm`}>
                                    {modalAction === 'approve'
                                        ? <><strong>Info:</strong> Os dados do veículo serão atualizados automaticamente e o motorista receberá um email de confirmação.</>
                                        : <><strong>Atenção:</strong> O motorista receberá um email com este motivo e poderá fazer uma nova solicitação corrigindo os pontos mencionados.</>}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedRequest(null);
                                    setAdminMessage('');
                                }}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={processing || (modalAction === 'reject' && !adminMessage.trim())}
                                className={`flex-1 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 ${
                                    modalAction === 'approve'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {processing
                                    ? 'Processando...'
                                    : modalAction === 'approve'
                                        ? 'Confirmar Aprovação'
                                        : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
