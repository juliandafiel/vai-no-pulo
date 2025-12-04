import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getFullUrl } from '../services/api';

export default function Dashboard() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [pendingUsers, setPendingUsers] = useState(0);
    const [pendingVehicleChanges, setPendingVehicleChanges] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
    const [adminMessage, setAdminMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadVehicles();
        loadPendingUsers();
        loadPendingVehicleChanges();
    }, []);

    async function loadVehicles() {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function loadPendingUsers() {
        try {
            const response = await api.get('/users', { params: { status: 'PENDING' } });
            setPendingUsers(response.data.length);
        } catch (error) {
            console.error(error);
        }
    }

    async function loadPendingVehicleChanges() {
        try {
            const response = await api.get('/vehicle-change-requests/pending');
            setPendingVehicleChanges(response.data.length);
        } catch (error) {
            console.error(error);
        }
    }

    function openModal(vehicle: any, action: 'approve' | 'reject') {
        setSelectedVehicle(vehicle);
        setModalAction(action);
        setAdminMessage('');
        setShowModal(true);
    }

    async function handleConfirmAction() {
        if (!selectedVehicle) return;

        if (modalAction === 'reject' && !adminMessage.trim()) {
            alert('Por favor, informe o motivo da reprovacao');
            return;
        }

        setProcessing(true);
        try {
            if (modalAction === 'approve') {
                await api.patch(`/vehicles/${selectedVehicle.id}/approve`, {
                    notes: adminMessage.trim() || null,
                });
                alert('Veiculo aprovado com sucesso! O motorista sera notificado por email.');
            } else {
                await api.patch(`/vehicles/${selectedVehicle.id}/reject`, {
                    notes: adminMessage.trim(),
                });
                alert('Veiculo reprovado. O motorista sera notificado por email.');
            }
            setShowModal(false);
            setSelectedVehicle(null);
            setAdminMessage('');
            loadVehicles();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao processar solicitacao');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 mt-1">Visão geral do sistema</p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div
                    onClick={() => navigate('/')}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                        {vehicles.filter(v => v.status === 'PENDING').length > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {vehicles.filter(v => v.status === 'PENDING').length}
                            </span>
                        )}
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Veículos Pendentes</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {vehicles.filter(v => v.status === 'PENDING').length}
                    </p>
                </div>

                <div
                    onClick={() => navigate('/users')}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        {pendingUsers > 0 && (
                            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {pendingUsers}
                            </span>
                        )}
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Usuários Pendentes</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{pendingUsers}</p>
                </div>

                <div
                    onClick={() => navigate('/vehicle-change-requests')}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        {pendingVehicleChanges > 0 && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {pendingVehicleChanges}
                            </span>
                        )}
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Alterações de Veículo</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{pendingVehicleChanges}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Veículos Aprovados</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {vehicles.filter(v => v.status === 'APPROVED').length}
                    </p>
                </div>
            </div>

            {/* Lista de Veículos Pendentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Veículos Pendentes de Aprovação</h2>
                </div>
                {vehicles.filter(v => v.status === 'PENDING').length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">Nenhum veículo pendente de aprovação</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {vehicles.filter(v => v.status === 'PENDING').map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const rawPhotoUrl = v.vehiclePhoto || v.documents?.photo;
                                                const photoUrl = getFullUrl(rawPhotoUrl);

                                                if (photoUrl) {
                                                    return (
                                                        <img
                                                            src={photoUrl}
                                                            alt="Foto do veículo"
                                                            className="w-20 h-14 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                            onClick={() => setImagePreview(photoUrl)}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    );
                                                } else {
                                                    return (
                                                        <div className="w-20 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                                                            🚗
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{v.plate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.model}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pendente
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <button
                                                onClick={() => openModal(v, 'approve')}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => openModal(v, 'reject')}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Reprovar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Aprovacao/Reprovacao */}
            {showModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className={`p-6 border-b border-gray-100 ${modalAction === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className={`text-xl font-semibold ${modalAction === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                                {modalAction === 'approve' ? 'Aprovar Veiculo' : 'Reprovar Veiculo'}
                            </h3>
                            <p className="text-gray-600 mt-1">
                                {modalAction === 'approve'
                                    ? 'Confirme a aprovacao. Voce pode adicionar uma mensagem opcional para o motorista.'
                                    : 'Informe o motivo da reprovacao. Esta mensagem sera enviada por email ao motorista.'}
                            </p>
                        </div>
                        <div className="p-6">
                            {/* Info do Veiculo */}
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex gap-4">
                                    {(() => {
                                        const rawPhotoUrl = selectedVehicle.vehiclePhoto || selectedVehicle.documents?.photo;
                                        const photoUrl = getFullUrl(rawPhotoUrl);

                                        if (photoUrl) {
                                            return (
                                                <img
                                                    src={photoUrl}
                                                    alt="Foto do veículo"
                                                    className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                    onClick={() => setImagePreview(photoUrl)}
                                                />
                                            );
                                        } else {
                                            return (
                                                <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-4xl">
                                                    🚗
                                                </div>
                                            );
                                        }
                                    })()}
                                    <div>
                                        <p className="text-sm text-gray-500">Veiculo</p>
                                        <p className="font-semibold text-gray-800">{selectedVehicle.model}</p>
                                        <p className="text-gray-600">Placa: {selectedVehicle.plate}</p>
                                        {selectedVehicle.documents?.year && (
                                            <p className="text-gray-500 text-sm">Ano: {selectedVehicle.documents.year}</p>
                                        )}
                                        {selectedVehicle.documents?.color && (
                                            <p className="text-gray-500 text-sm">Cor: {selectedVehicle.documents.color}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {modalAction === 'approve' ? 'Mensagem (opcional)' : 'Motivo da Reprovacao *'}
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
                                        : 'Descreva o motivo da reprovacao...'}
                                />
                            </div>
                            <div className={`${modalAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                                <p className={`${modalAction === 'approve' ? 'text-green-800' : 'text-yellow-800'} text-sm`}>
                                    {modalAction === 'approve'
                                        ? <><strong>Info:</strong> O veiculo sera aprovado e o motorista podera comecar a utilizar o sistema.</>
                                        : <><strong>Atencao:</strong> O motorista recebera um email com este motivo e podera fazer uma nova solicitacao corrigindo os pontos mencionados.</>}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedVehicle(null);
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
                                        ? 'Confirmar Aprovacao'
                                        : 'Confirmar Reprovacao'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Preview da Imagem */}
            {imagePreview && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
                    onClick={() => setImagePreview(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
