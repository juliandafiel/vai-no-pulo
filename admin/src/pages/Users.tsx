import React, { useEffect, useState } from 'react';
import api, { getFullUrl } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'USER' | 'DRIVER' | 'ADMIN';
    profileStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    rejectionReason?: string;
    // Campos de documentos
    cpf?: string;
    rg?: string;
    birthDate?: string;
    cnh?: string;
    cnhCategory?: string;
    cnhExpiry?: string;
    documentType?: string;
    documentNumber?: string;
    documentFront?: string;
    documentBack?: string;
    profilePhoto?: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showDocumentsModal, setShowDocumentsModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, [filter]);

    async function loadUsers() {
        try {
            setLoading(true);
            const params: any = {};
            if (filter !== 'ALL') {
                params.status = filter;
            }
            const response = await api.get('/users', { params });
            setUsers(response.data);
        } catch (error: any) {
            console.error(error);
            alert('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(user: User) {
        if (!confirm(`Deseja aprovar o cadastro de ${user.name}?`)) {
            return;
        }

        try {
            await api.patch(`/users/${user.id}/approve`);
            alert('Usuário aprovado com sucesso!');
            loadUsers();
        } catch (error) {
            console.error(error);
            alert('Erro ao aprovar usuário');
        }
    }

    async function handleReject(user: User) {
        setSelectedUser(user);
        setShowRejectModal(true);
    }

    async function confirmReject() {
        if (!selectedUser || !rejectionReason.trim()) {
            alert('Por favor, informe o motivo da rejeição');
            return;
        }

        try {
            await api.patch(`/users/${selectedUser.id}/reject`, {
                reason: rejectionReason,
            });
            alert('Usuário rejeitado!');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedUser(null);
            loadUsers();
        } catch (error) {
            console.error(error);
            alert('Erro ao rejeitar usuário');
        }
    }

    function getStatusBadge(status: string) {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || '';
    }

    function getRoleName(role: string) {
        const names = {
            USER: 'Cliente',
            DRIVER: 'Motorista',
            ADMIN: 'Administrador',
        };
        return names[role as keyof typeof names] || role;
    }

    function getStatusName(status: string) {
        const names = {
            PENDING: 'Pendente',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
        };
        return names[status as keyof typeof names] || status;
    }

    function handleViewDocuments(user: User) {
        setSelectedUser(user);
        setShowDocumentsModal(true);
    }

    function hasDocuments(user: User) {
        return user.profilePhoto || user.documentFront || user.documentBack;
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Usuários</h1>
                    <p className="text-gray-500 mt-1">Gerencie os cadastros de usuários e motoristas</p>
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
                            {status === 'ALL' ? 'Todos' :
                             status === 'PENDING' ? 'Pendentes' :
                             status === 'APPROVED' ? 'Aprovados' : 'Rejeitados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Carregando...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum usuário encontrado
                    </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 text-left">Nome</th>
                                    <th className="p-4 text-left">Email</th>
                                    <th className="p-4 text-left">Telefone</th>
                                    <th className="p-4 text-left">Tipo</th>
                                    <th className="p-4 text-left">Status</th>
                                    <th className="p-4 text-left">Cadastro</th>
                                    <th className="p-4 text-left">Docs</th>
                                    <th className="p-4 text-left">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-t hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium">{user.name}</div>
                                            {user.cpf && (
                                                <div className="text-sm text-gray-500">CPF: {user.cpf}</div>
                                            )}
                                            {user.cnh && (
                                                <div className="text-sm text-gray-500">
                                                    CNH: {user.cnh} ({user.cnhCategory})
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">{user.email}</td>
                                        <td className="p-4 text-sm">{user.phone || '-'}</td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium">
                                                {getRoleName(user.role)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-sm ${getStatusBadge(user.profileStatus)}`}>
                                                {getStatusName(user.profileStatus)}
                                            </span>
                                            {user.rejectionReason && (
                                                <div className="text-xs text-red-600 mt-1">
                                                    Motivo: {user.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4">
                                            {hasDocuments(user) ? (
                                                <button
                                                    onClick={() => handleViewDocuments(user)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                                                >
                                                    Ver Docs
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.profileStatus === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(user)}
                                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user)}
                                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                                    >
                                                        Rejeitar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>

            {/* Modal de Rejeição */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Rejeitar Cadastro</h2>
                        <p className="mb-4 text-gray-700">
                            Você está prestes a rejeitar o cadastro de <strong>{selectedUser?.name}</strong>.
                        </p>
                        <label className="block mb-2 font-medium">
                            Motivo da rejeição:
                        </label>
                        <textarea
                            className="w-full border rounded p-2 mb-4"
                            rows={4}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explique o motivo da rejeição..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Confirmar Rejeição
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Documentos */}
            {showDocumentsModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Documentos de {selectedUser.name}</h2>
                            <button
                                onClick={() => {
                                    setShowDocumentsModal(false);
                                    setSelectedUser(null);
                                    setSelectedImageUrl(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Informações do usuário */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold mb-3">Informações Pessoais</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Nome:</span>
                                    <p className="font-medium">{selectedUser.name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Email:</span>
                                    <p className="font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Telefone:</span>
                                    <p className="font-medium">{selectedUser.phone || '-'}</p>
                                </div>
                                {selectedUser.cpf && (
                                    <div>
                                        <span className="text-gray-500">CPF:</span>
                                        <p className="font-medium">{selectedUser.cpf}</p>
                                    </div>
                                )}
                                {selectedUser.rg && (
                                    <div>
                                        <span className="text-gray-500">RG:</span>
                                        <p className="font-medium">{selectedUser.rg}</p>
                                    </div>
                                )}
                                {selectedUser.birthDate && (
                                    <div>
                                        <span className="text-gray-500">Data de Nascimento:</span>
                                        <p className="font-medium">{selectedUser.birthDate}</p>
                                    </div>
                                )}
                                {selectedUser.cnh && (
                                    <div>
                                        <span className="text-gray-500">CNH:</span>
                                        <p className="font-medium">{selectedUser.cnh}</p>
                                    </div>
                                )}
                                {selectedUser.cnhCategory && (
                                    <div>
                                        <span className="text-gray-500">Categoria CNH:</span>
                                        <p className="font-medium">{selectedUser.cnhCategory}</p>
                                    </div>
                                )}
                                {selectedUser.cnhExpiry && (
                                    <div>
                                        <span className="text-gray-500">Validade CNH:</span>
                                        <p className="font-medium">{selectedUser.cnhExpiry}</p>
                                    </div>
                                )}
                                {selectedUser.documentType && (
                                    <div>
                                        <span className="text-gray-500">Tipo de Documento:</span>
                                        <p className="font-medium">{selectedUser.documentType}</p>
                                    </div>
                                )}
                                {selectedUser.documentNumber && (
                                    <div>
                                        <span className="text-gray-500">Número do Documento:</span>
                                        <p className="font-medium">{selectedUser.documentNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Imagens/Documentos */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">Fotos e Documentos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Foto de Perfil */}
                                {selectedUser.profilePhoto && (
                                    <div className="border rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-2">Foto de Perfil</p>
                                        <img
                                            src={getFullUrl(selectedUser.profilePhoto) || ''}
                                            alt="Foto de Perfil"
                                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImageUrl(getFullUrl(selectedUser.profilePhoto))}
                                        />
                                    </div>
                                )}

                                {/* Documento Frente */}
                                {selectedUser.documentFront && (
                                    <div className="border rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-2">Documento (Frente)</p>
                                        <img
                                            src={getFullUrl(selectedUser.documentFront) || ''}
                                            alt="Documento Frente"
                                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImageUrl(getFullUrl(selectedUser.documentFront))}
                                        />
                                    </div>
                                )}

                                {/* Documento Verso */}
                                {selectedUser.documentBack && (
                                    <div className="border rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-2">Documento (Verso)</p>
                                        <img
                                            src={getFullUrl(selectedUser.documentBack) || ''}
                                            alt="Documento Verso"
                                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImageUrl(getFullUrl(selectedUser.documentBack))}
                                        />
                                    </div>
                                )}

                                {!selectedUser.profilePhoto && !selectedUser.documentFront && !selectedUser.documentBack && (
                                    <div className="col-span-3 text-center text-gray-500 py-8">
                                        Nenhuma imagem ou documento enviado
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botões de ação */}
                        {selectedUser.profileStatus === 'PENDING' && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setShowDocumentsModal(false);
                                        handleReject(selectedUser);
                                    }}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Rejeitar
                                </button>
                                <button
                                    onClick={() => {
                                        handleApprove(selectedUser);
                                        setShowDocumentsModal(false);
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Aprovar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Imagem Ampliada */}
            {selectedImageUrl && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]"
                    onClick={() => setSelectedImageUrl(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedImageUrl(null)}
                            className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300"
                        >
                            &times;
                        </button>
                        <img
                            src={selectedImageUrl}
                            alt="Imagem ampliada"
                            className="max-w-full max-h-[85vh] object-contain rounded"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
