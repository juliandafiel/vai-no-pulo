/**
 * Tabela de referência com pesos e dimensões médias por categoria/subcategoria
 * Valores são aproximados e servem como sugestão inicial
 */

export interface ProductDimensions {
    weight: number;      // Peso em kg
    height: number;      // Altura em cm
    width: number;       // Largura em cm
    length: number;      // Comprimento em cm
    description?: string; // Descrição do tamanho típico
}

// Dimensões padrão por subcategoria
export const PRODUCT_DIMENSIONS: Record<string, Record<string, ProductDimensions>> = {
    // ============ ELETRÔNICOS ============
    electronics: {
        tv: {
            weight: 12,
            height: 70,
            width: 120,
            length: 15,
            description: 'TV 50-55 polegadas',
        },
        audio: {
            weight: 5,
            height: 30,
            width: 40,
            length: 25,
            description: 'Caixa de som média',
        },
        videogame: {
            weight: 4,
            height: 10,
            width: 40,
            length: 30,
            description: 'Console com controles',
        },
        computer: {
            weight: 3,
            height: 3,
            width: 35,
            length: 25,
            description: 'Notebook 15 polegadas',
        },
        smartphone: {
            weight: 0.5,
            height: 15,
            width: 8,
            length: 3,
            description: 'Celular com caixa',
        },
        appliances: {
            weight: 25,
            height: 60,
            width: 50,
            length: 50,
            description: 'Eletrodoméstico médio',
        },
        other_electronics: {
            weight: 2,
            height: 20,
            width: 20,
            length: 15,
            description: 'Eletrônico pequeno',
        },
    },

    // ============ ROUPAS E CALÇADOS ============
    clothes: {
        casual: {
            weight: 1,
            height: 10,
            width: 30,
            length: 40,
            description: 'Pacote de roupas dobradas',
        },
        formal: {
            weight: 1.5,
            height: 15,
            width: 40,
            length: 60,
            description: 'Roupas em cabide/caixa',
        },
        shoes: {
            weight: 1.5,
            height: 15,
            width: 35,
            length: 30,
            description: 'Par de calçados na caixa',
        },
        accessories: {
            weight: 0.3,
            height: 10,
            width: 15,
            length: 15,
            description: 'Acessórios pequenos',
        },
    },

    // ============ CAMA, MESA E BANHO ============
    home: {
        bedding: {
            weight: 3,
            height: 20,
            width: 50,
            length: 40,
            description: 'Jogo de cama dobrado',
        },
        towels: {
            weight: 2,
            height: 15,
            width: 40,
            length: 30,
            description: 'Kit de toalhas',
        },
        table: {
            weight: 4,
            height: 25,
            width: 40,
            length: 40,
            description: 'Jogo de jantar/panelas',
        },
        decoration: {
            weight: 2,
            height: 30,
            width: 30,
            length: 30,
            description: 'Objeto decorativo',
        },
    },

    // ============ ALIMENTOS ============
    food: {
        perishable: {
            weight: 5,
            height: 30,
            width: 40,
            length: 30,
            description: 'Caixa de alimentos',
        },
        non_perishable: {
            weight: 8,
            height: 30,
            width: 40,
            length: 40,
            description: 'Caixa de mantimentos',
        },
        beverages: {
            weight: 10,
            height: 35,
            width: 30,
            length: 40,
            description: 'Caixa de bebidas',
        },
        frozen: {
            weight: 5,
            height: 25,
            width: 35,
            length: 35,
            description: 'Caixa térmica',
        },
    },

    // ============ MÓVEIS ============
    furniture: {
        sofa: {
            weight: 45,
            height: 90,
            width: 200,
            length: 90,
            description: 'Sofá 3 lugares',
        },
        table_furniture: {
            weight: 20,
            height: 80,
            width: 120,
            length: 80,
            description: 'Mesa de jantar',
        },
        wardrobe: {
            weight: 60,
            height: 200,
            width: 150,
            length: 60,
            description: 'Guarda-roupa médio',
        },
        bed: {
            weight: 35,
            height: 30,
            width: 140,
            length: 200,
            description: 'Cama casal com colchão',
        },
        office: {
            weight: 15,
            height: 75,
            width: 120,
            length: 60,
            description: 'Mesa de escritório',
        },
    },

    // ============ DOCUMENTOS ============
    documents: {
        personal: {
            weight: 0.5,
            height: 5,
            width: 25,
            length: 35,
            description: 'Envelope/pasta de documentos',
        },
        business: {
            weight: 2,
            height: 15,
            width: 35,
            length: 45,
            description: 'Caixa de documentos',
        },
        books: {
            weight: 5,
            height: 20,
            width: 30,
            length: 25,
            description: 'Caixa de livros',
        },
    },

    // ============ OUTROS ============
    other: {
        sports: {
            weight: 3,
            height: 40,
            width: 40,
            length: 40,
            description: 'Equipamento esportivo',
        },
        toys: {
            weight: 2,
            height: 30,
            width: 40,
            length: 30,
            description: 'Brinquedo médio',
        },
        tools: {
            weight: 8,
            height: 20,
            width: 50,
            length: 30,
            description: 'Caixa de ferramentas',
        },
        misc: {
            weight: 3,
            height: 30,
            width: 30,
            length: 30,
            description: 'Objeto médio',
        },
    },
};

// Dimensões específicas por marca (para eletrônicos)
export const BRAND_DIMENSIONS: Record<string, Record<string, ProductDimensions>> = {
    // TVs por tamanho aproximado
    tv: {
        '32': { weight: 5, height: 45, width: 75, length: 10, description: 'TV 32 polegadas' },
        '40': { weight: 8, height: 55, width: 95, length: 12, description: 'TV 40 polegadas' },
        '50': { weight: 12, height: 70, width: 115, length: 12, description: 'TV 50 polegadas' },
        '55': { weight: 15, height: 75, width: 125, length: 12, description: 'TV 55 polegadas' },
        '65': { weight: 22, height: 85, width: 145, length: 12, description: 'TV 65 polegadas' },
        '75': { weight: 35, height: 100, width: 170, length: 15, description: 'TV 75 polegadas' },
    },
    // Notebooks por marca
    notebook: {
        'Apple': { weight: 1.5, height: 2, width: 31, length: 22, description: 'MacBook' },
        'Dell': { weight: 2.2, height: 2.5, width: 36, length: 25, description: 'Notebook Dell' },
        'HP': { weight: 2.3, height: 2.5, width: 36, length: 25, description: 'Notebook HP' },
        'Lenovo': { weight: 2.1, height: 2.3, width: 35, length: 24, description: 'Notebook Lenovo' },
    },
    // Consoles
    videogame: {
        'PlayStation': { weight: 4.5, height: 10, width: 39, length: 26, description: 'PlayStation 5' },
        'Xbox': { weight: 4.5, height: 15, width: 30, length: 15, description: 'Xbox Series X' },
        'Nintendo': { weight: 0.4, height: 4, width: 24, length: 10, description: 'Nintendo Switch' },
    },
    // Eletrodomésticos
    appliances: {
        'geladeira_pequena': { weight: 30, height: 130, width: 55, length: 55, description: 'Geladeira pequena' },
        'geladeira_media': { weight: 55, height: 170, width: 65, length: 70, description: 'Geladeira média' },
        'geladeira_grande': { weight: 80, height: 190, width: 75, length: 80, description: 'Geladeira grande' },
        'maquina_lavar': { weight: 40, height: 100, width: 65, length: 65, description: 'Máquina de lavar' },
        'microondas': { weight: 12, height: 30, width: 50, length: 40, description: 'Micro-ondas' },
        'fogao': { weight: 35, height: 95, width: 55, length: 60, description: 'Fogão 4 bocas' },
        'ar_condicionado': { weight: 12, height: 30, width: 80, length: 25, description: 'Ar condicionado split' },
    },
};

/**
 * Obtém as dimensões padrão para uma categoria/subcategoria
 */
export function getDefaultDimensions(category: string, subcategory: string): ProductDimensions | null {
    const categoryData = PRODUCT_DIMENSIONS[category];
    if (!categoryData) return null;

    return categoryData[subcategory] || null;
}

/**
 * Obtém dimensões específicas por marca/tipo
 */
export function getBrandDimensions(type: string, brandOrSize: string): ProductDimensions | null {
    const typeData = BRAND_DIMENSIONS[type];
    if (!typeData) return null;

    return typeData[brandOrSize] || null;
}

/**
 * Calcula o volume em metros cúbicos
 */
export function calculateVolumeCubicMeters(height: number, width: number, length: number): number {
    // Converte de cm³ para m³
    return (height * width * length) / 1000000;
}

/**
 * Calcula o peso volumétrico (usado por transportadoras)
 * Fator padrão: 6000 (1m³ = 166.67kg)
 */
export function calculateVolumetricWeight(height: number, width: number, length: number, factor: number = 6000): number {
    return (height * width * length) / factor;
}

/**
 * Retorna o maior entre peso real e peso volumétrico (peso cubado)
 */
export function getCubedWeight(realWeight: number, height: number, width: number, length: number): number {
    const volumetricWeight = calculateVolumetricWeight(height, width, length);
    return Math.max(realWeight, volumetricWeight);
}

/**
 * Formata as dimensões para exibição
 */
export function formatDimensions(height: number, width: number, length: number): string {
    return `${height} x ${width} x ${length} cm`;
}

/**
 * Formata o volume para exibição
 */
export function formatVolume(height: number, width: number, length: number): string {
    const volumeM3 = calculateVolumeCubicMeters(height, width, length);
    if (volumeM3 < 0.001) {
        return `${(volumeM3 * 1000000).toFixed(0)} cm³`;
    }
    return `${volumeM3.toFixed(3)} m³`;
}

/**
 * Lista de tamanhos de TV disponíveis
 */
export const TV_SIZES = ['32', '40', '50', '55', '65', '75'];

/**
 * Lista de tipos de eletrodomésticos
 */
export const APPLIANCE_TYPES = [
    { id: 'geladeira_pequena', label: 'Geladeira Pequena (até 300L)' },
    { id: 'geladeira_media', label: 'Geladeira Média (300-450L)' },
    { id: 'geladeira_grande', label: 'Geladeira Grande (450L+)' },
    { id: 'maquina_lavar', label: 'Máquina de Lavar' },
    { id: 'microondas', label: 'Micro-ondas' },
    { id: 'fogao', label: 'Fogão' },
    { id: 'ar_condicionado', label: 'Ar Condicionado' },
];
