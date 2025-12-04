// Dados de marcas e modelos de veículos
// Baseado nas marcas mais populares no Brasil

export interface VehicleBrand {
    value: string;
    label: string;
}

export interface VehicleModel {
    value: string;
    label: string;
    brand: string;
}

// Marcas de Carros/Pickups/SUVs
export const carBrands: VehicleBrand[] = [
    { value: 'FIAT', label: 'Fiat' },
    { value: 'VOLKSWAGEN', label: 'Volkswagen' },
    { value: 'CHEVROLET', label: 'Chevrolet' },
    { value: 'FORD', label: 'Ford' },
    { value: 'TOYOTA', label: 'Toyota' },
    { value: 'HYUNDAI', label: 'Hyundai' },
    { value: 'HONDA', label: 'Honda' },
    { value: 'RENAULT', label: 'Renault' },
    { value: 'JEEP', label: 'Jeep' },
    { value: 'NISSAN', label: 'Nissan' },
    { value: 'PEUGEOT', label: 'Peugeot' },
    { value: 'CITROEN', label: 'Citroën' },
    { value: 'MITSUBISHI', label: 'Mitsubishi' },
    { value: 'KIA', label: 'Kia' },
    { value: 'BMW', label: 'BMW' },
    { value: 'MERCEDES', label: 'Mercedes-Benz' },
    { value: 'AUDI', label: 'Audi' },
    { value: 'VOLVO', label: 'Volvo' },
    { value: 'SUZUKI', label: 'Suzuki' },
    { value: 'CHERY', label: 'Chery' },
    { value: 'CAOA_CHERY', label: 'Caoa Chery' },
    { value: 'JAC', label: 'JAC' },
    { value: 'RAM', label: 'RAM' },
    { value: 'OUTRO', label: 'Outro' },
];

// Marcas de Vans/Furgões
export const vanBrands: VehicleBrand[] = [
    { value: 'FIAT', label: 'Fiat' },
    { value: 'MERCEDES', label: 'Mercedes-Benz' },
    { value: 'RENAULT', label: 'Renault' },
    { value: 'PEUGEOT', label: 'Peugeot' },
    { value: 'CITROEN', label: 'Citroën' },
    { value: 'FORD', label: 'Ford' },
    { value: 'IVECO', label: 'Iveco' },
    { value: 'HYUNDAI', label: 'Hyundai' },
    { value: 'VOLKSWAGEN', label: 'Volkswagen' },
    { value: 'OUTRO', label: 'Outro' },
];

// Marcas de Caminhões
export const truckBrands: VehicleBrand[] = [
    { value: 'VOLKSWAGEN', label: 'Volkswagen' },
    { value: 'MERCEDES_TRUCKS', label: 'Mercedes-Benz' },
    { value: 'VOLVO_TRUCKS', label: 'Volvo' },
    { value: 'SCANIA', label: 'Scania' },
    { value: 'IVECO', label: 'Iveco' },
    { value: 'MAN', label: 'MAN' },
    { value: 'DAF', label: 'DAF' },
    { value: 'FORD', label: 'Ford' },
    { value: 'OUTRO', label: 'Outro' },
];

// Marcas de Motos
export const motorcycleBrands: VehicleBrand[] = [
    { value: 'HONDA_MOTO', label: 'Honda' },
    { value: 'YAMAHA', label: 'Yamaha' },
    { value: 'SUZUKI_MOTO', label: 'Suzuki' },
    { value: 'KAWASAKI', label: 'Kawasaki' },
    { value: 'BMW_MOTO', label: 'BMW' },
    { value: 'HARLEY', label: 'Harley-Davidson' },
    { value: 'TRIUMPH', label: 'Triumph' },
    { value: 'DUCATI', label: 'Ducati' },
    { value: 'KTM', label: 'KTM' },
    { value: 'DAFRA', label: 'Dafra' },
    { value: 'SHINERAY', label: 'Shineray' },
    { value: 'OUTRO', label: 'Outro' },
];

// Todas as marcas (para compatibilidade)
export const vehicleBrands: VehicleBrand[] = [
    ...carBrands,
    { value: 'IVECO', label: 'Iveco' },
    { value: 'SCANIA', label: 'Scania' },
    { value: 'VOLVO_TRUCKS', label: 'Volvo Caminhões' },
    { value: 'MERCEDES_TRUCKS', label: 'Mercedes-Benz Caminhões' },
    { value: 'MAN', label: 'MAN' },
    { value: 'DAF', label: 'DAF' },
    { value: 'HONDA_MOTO', label: 'Honda Motos' },
    { value: 'YAMAHA', label: 'Yamaha' },
    { value: 'SUZUKI_MOTO', label: 'Suzuki Motos' },
    { value: 'KAWASAKI', label: 'Kawasaki' },
    { value: 'BMW_MOTO', label: 'BMW Motorrad' },
    { value: 'HARLEY', label: 'Harley-Davidson' },
    { value: 'TRIUMPH', label: 'Triumph' },
    { value: 'DUCATI', label: 'Ducati' },
    { value: 'KTM', label: 'KTM' },
    { value: 'DAFRA', label: 'Dafra' },
    { value: 'SHINERAY', label: 'Shineray' },
];

export const vehicleModels: VehicleModel[] = [
    // FIAT
    { value: 'FIAT_STRADA', label: 'Strada', brand: 'FIAT' },
    { value: 'FIAT_TORO', label: 'Toro', brand: 'FIAT' },
    { value: 'FIAT_FIORINO', label: 'Fiorino', brand: 'FIAT' },
    { value: 'FIAT_DUCATO', label: 'Ducato', brand: 'FIAT' },
    { value: 'FIAT_DOBLO', label: 'Doblò', brand: 'FIAT' },
    { value: 'FIAT_UNO', label: 'Uno', brand: 'FIAT' },
    { value: 'FIAT_ARGO', label: 'Argo', brand: 'FIAT' },
    { value: 'FIAT_MOBI', label: 'Mobi', brand: 'FIAT' },
    { value: 'FIAT_PULSE', label: 'Pulse', brand: 'FIAT' },
    { value: 'FIAT_FASTBACK', label: 'Fastback', brand: 'FIAT' },
    { value: 'FIAT_CRONOS', label: 'Cronos', brand: 'FIAT' },
    { value: 'FIAT_SIENA', label: 'Siena', brand: 'FIAT' },
    { value: 'FIAT_PALIO', label: 'Palio', brand: 'FIAT' },

    // VOLKSWAGEN
    { value: 'VW_SAVEIRO', label: 'Saveiro', brand: 'VOLKSWAGEN' },
    { value: 'VW_AMAROK', label: 'Amarok', brand: 'VOLKSWAGEN' },
    { value: 'VW_GOL', label: 'Gol', brand: 'VOLKSWAGEN' },
    { value: 'VW_VOYAGE', label: 'Voyage', brand: 'VOLKSWAGEN' },
    { value: 'VW_POLO', label: 'Polo', brand: 'VOLKSWAGEN' },
    { value: 'VW_VIRTUS', label: 'Virtus', brand: 'VOLKSWAGEN' },
    { value: 'VW_NIVUS', label: 'Nivus', brand: 'VOLKSWAGEN' },
    { value: 'VW_TCROSS', label: 'T-Cross', brand: 'VOLKSWAGEN' },
    { value: 'VW_TAOS', label: 'Taos', brand: 'VOLKSWAGEN' },
    { value: 'VW_TIGUAN', label: 'Tiguan', brand: 'VOLKSWAGEN' },
    { value: 'VW_DELIVERY', label: 'Delivery', brand: 'VOLKSWAGEN' },
    { value: 'VW_CONSTELLATION', label: 'Constellation', brand: 'VOLKSWAGEN' },
    { value: 'VW_KOMBI', label: 'Kombi', brand: 'VOLKSWAGEN' },

    // CHEVROLET
    { value: 'GM_MONTANA', label: 'Montana', brand: 'CHEVROLET' },
    { value: 'GM_S10', label: 'S10', brand: 'CHEVROLET' },
    { value: 'GM_ONIX', label: 'Onix', brand: 'CHEVROLET' },
    { value: 'GM_ONIX_PLUS', label: 'Onix Plus', brand: 'CHEVROLET' },
    { value: 'GM_TRACKER', label: 'Tracker', brand: 'CHEVROLET' },
    { value: 'GM_SPIN', label: 'Spin', brand: 'CHEVROLET' },
    { value: 'GM_EQUINOX', label: 'Equinox', brand: 'CHEVROLET' },
    { value: 'GM_TRAILBLAZER', label: 'Trailblazer', brand: 'CHEVROLET' },
    { value: 'GM_CRUZE', label: 'Cruze', brand: 'CHEVROLET' },
    { value: 'GM_CELTA', label: 'Celta', brand: 'CHEVROLET' },
    { value: 'GM_PRISMA', label: 'Prisma', brand: 'CHEVROLET' },
    { value: 'GM_COBALT', label: 'Cobalt', brand: 'CHEVROLET' },

    // FORD
    { value: 'FORD_RANGER', label: 'Ranger', brand: 'FORD' },
    { value: 'FORD_MAVERICK', label: 'Maverick', brand: 'FORD' },
    { value: 'FORD_F150', label: 'F-150', brand: 'FORD' },
    { value: 'FORD_TRANSIT', label: 'Transit', brand: 'FORD' },
    { value: 'FORD_KA', label: 'Ka', brand: 'FORD' },
    { value: 'FORD_ECOSPORT', label: 'EcoSport', brand: 'FORD' },
    { value: 'FORD_TERRITORY', label: 'Territory', brand: 'FORD' },
    { value: 'FORD_BRONCO', label: 'Bronco Sport', brand: 'FORD' },
    { value: 'FORD_FIESTA', label: 'Fiesta', brand: 'FORD' },
    { value: 'FORD_FOCUS', label: 'Focus', brand: 'FORD' },
    { value: 'FORD_FUSION', label: 'Fusion', brand: 'FORD' },
    { value: 'FORD_CARGO', label: 'Cargo', brand: 'FORD' },

    // TOYOTA
    { value: 'TOYOTA_HILUX', label: 'Hilux', brand: 'TOYOTA' },
    { value: 'TOYOTA_COROLLA', label: 'Corolla', brand: 'TOYOTA' },
    { value: 'TOYOTA_COROLLA_CROSS', label: 'Corolla Cross', brand: 'TOYOTA' },
    { value: 'TOYOTA_YARIS', label: 'Yaris', brand: 'TOYOTA' },
    { value: 'TOYOTA_SW4', label: 'SW4', brand: 'TOYOTA' },
    { value: 'TOYOTA_RAV4', label: 'RAV4', brand: 'TOYOTA' },
    { value: 'TOYOTA_PRIUS', label: 'Prius', brand: 'TOYOTA' },
    { value: 'TOYOTA_CAMRY', label: 'Camry', brand: 'TOYOTA' },
    { value: 'TOYOTA_ETIOS', label: 'Etios', brand: 'TOYOTA' },

    // HYUNDAI
    { value: 'HYUNDAI_HB20', label: 'HB20', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_HB20S', label: 'HB20S', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_CRETA', label: 'Creta', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_TUCSON', label: 'Tucson', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_HR', label: 'HR', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_IX35', label: 'ix35', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_SANTA_FE', label: 'Santa Fe', brand: 'HYUNDAI' },
    { value: 'HYUNDAI_AZERA', label: 'Azera', brand: 'HYUNDAI' },

    // HONDA
    { value: 'HONDA_CIVIC', label: 'Civic', brand: 'HONDA' },
    { value: 'HONDA_CITY', label: 'City', brand: 'HONDA' },
    { value: 'HONDA_FIT', label: 'Fit', brand: 'HONDA' },
    { value: 'HONDA_HRV', label: 'HR-V', brand: 'HONDA' },
    { value: 'HONDA_CRV', label: 'CR-V', brand: 'HONDA' },
    { value: 'HONDA_WRV', label: 'WR-V', brand: 'HONDA' },
    { value: 'HONDA_ACCORD', label: 'Accord', brand: 'HONDA' },
    { value: 'HONDA_ZRV', label: 'ZR-V', brand: 'HONDA' },

    // RENAULT
    { value: 'RENAULT_OROCH', label: 'Oroch', brand: 'RENAULT' },
    { value: 'RENAULT_DUSTER', label: 'Duster', brand: 'RENAULT' },
    { value: 'RENAULT_KWID', label: 'Kwid', brand: 'RENAULT' },
    { value: 'RENAULT_SANDERO', label: 'Sandero', brand: 'RENAULT' },
    { value: 'RENAULT_LOGAN', label: 'Logan', brand: 'RENAULT' },
    { value: 'RENAULT_CAPTUR', label: 'Captur', brand: 'RENAULT' },
    { value: 'RENAULT_MASTER', label: 'Master', brand: 'RENAULT' },
    { value: 'RENAULT_KANGOO', label: 'Kangoo', brand: 'RENAULT' },

    // JEEP
    { value: 'JEEP_RENEGADE', label: 'Renegade', brand: 'JEEP' },
    { value: 'JEEP_COMPASS', label: 'Compass', brand: 'JEEP' },
    { value: 'JEEP_COMMANDER', label: 'Commander', brand: 'JEEP' },
    { value: 'JEEP_GLADIATOR', label: 'Gladiator', brand: 'JEEP' },
    { value: 'JEEP_WRANGLER', label: 'Wrangler', brand: 'JEEP' },
    { value: 'JEEP_CHEROKEE', label: 'Grand Cherokee', brand: 'JEEP' },

    // NISSAN
    { value: 'NISSAN_FRONTIER', label: 'Frontier', brand: 'NISSAN' },
    { value: 'NISSAN_KICKS', label: 'Kicks', brand: 'NISSAN' },
    { value: 'NISSAN_VERSA', label: 'Versa', brand: 'NISSAN' },
    { value: 'NISSAN_SENTRA', label: 'Sentra', brand: 'NISSAN' },
    { value: 'NISSAN_MARCH', label: 'March', brand: 'NISSAN' },
    { value: 'NISSAN_XTRAIL', label: 'X-Trail', brand: 'NISSAN' },

    // PEUGEOT
    { value: 'PEUGEOT_PARTNER', label: 'Partner', brand: 'PEUGEOT' },
    { value: 'PEUGEOT_BOXER', label: 'Boxer', brand: 'PEUGEOT' },
    { value: 'PEUGEOT_208', label: '208', brand: 'PEUGEOT' },
    { value: 'PEUGEOT_2008', label: '2008', brand: 'PEUGEOT' },
    { value: 'PEUGEOT_3008', label: '3008', brand: 'PEUGEOT' },
    { value: 'PEUGEOT_5008', label: '5008', brand: 'PEUGEOT' },

    // CITROEN
    { value: 'CITROEN_JUMPY', label: 'Jumpy', brand: 'CITROEN' },
    { value: 'CITROEN_JUMPER', label: 'Jumper', brand: 'CITROEN' },
    { value: 'CITROEN_BERLINGO', label: 'Berlingo', brand: 'CITROEN' },
    { value: 'CITROEN_C3', label: 'C3', brand: 'CITROEN' },
    { value: 'CITROEN_C4_CACTUS', label: 'C4 Cactus', brand: 'CITROEN' },

    // MITSUBISHI
    { value: 'MITSUBISHI_L200', label: 'L200 Triton', brand: 'MITSUBISHI' },
    { value: 'MITSUBISHI_OUTLANDER', label: 'Outlander', brand: 'MITSUBISHI' },
    { value: 'MITSUBISHI_ECLIPSE', label: 'Eclipse Cross', brand: 'MITSUBISHI' },
    { value: 'MITSUBISHI_ASX', label: 'ASX', brand: 'MITSUBISHI' },
    { value: 'MITSUBISHI_PAJERO', label: 'Pajero', brand: 'MITSUBISHI' },

    // KIA
    { value: 'KIA_SPORTAGE', label: 'Sportage', brand: 'KIA' },
    { value: 'KIA_SORENTO', label: 'Sorento', brand: 'KIA' },
    { value: 'KIA_CERATO', label: 'Cerato', brand: 'KIA' },
    { value: 'KIA_SELTOS', label: 'Seltos', brand: 'KIA' },
    { value: 'KIA_STONIC', label: 'Stonic', brand: 'KIA' },
    { value: 'KIA_CARNIVAL', label: 'Carnival', brand: 'KIA' },
    { value: 'KIA_BONGO', label: 'Bongo', brand: 'KIA' },

    // BMW
    { value: 'BMW_X1', label: 'X1', brand: 'BMW' },
    { value: 'BMW_X3', label: 'X3', brand: 'BMW' },
    { value: 'BMW_X5', label: 'X5', brand: 'BMW' },
    { value: 'BMW_320', label: 'Série 3', brand: 'BMW' },
    { value: 'BMW_520', label: 'Série 5', brand: 'BMW' },

    // MERCEDES
    { value: 'MERCEDES_SPRINTER', label: 'Sprinter', brand: 'MERCEDES' },
    { value: 'MERCEDES_VITO', label: 'Vito', brand: 'MERCEDES' },
    { value: 'MERCEDES_CLASSE_A', label: 'Classe A', brand: 'MERCEDES' },
    { value: 'MERCEDES_CLASSE_C', label: 'Classe C', brand: 'MERCEDES' },
    { value: 'MERCEDES_GLA', label: 'GLA', brand: 'MERCEDES' },
    { value: 'MERCEDES_GLC', label: 'GLC', brand: 'MERCEDES' },

    // RAM
    { value: 'RAM_1500', label: '1500', brand: 'RAM' },
    { value: 'RAM_2500', label: '2500', brand: 'RAM' },
    { value: 'RAM_3500', label: '3500', brand: 'RAM' },
    { value: 'RAM_RAMPAGE', label: 'Rampage', brand: 'RAM' },

    // IVECO
    { value: 'IVECO_DAILY', label: 'Daily', brand: 'IVECO' },
    { value: 'IVECO_TECTOR', label: 'Tector', brand: 'IVECO' },
    { value: 'IVECO_STRALIS', label: 'Stralis', brand: 'IVECO' },
    { value: 'IVECO_HIWAY', label: 'Hi-Way', brand: 'IVECO' },

    // VOLVO TRUCKS
    { value: 'VOLVO_FH', label: 'FH', brand: 'VOLVO_TRUCKS' },
    { value: 'VOLVO_FM', label: 'FM', brand: 'VOLVO_TRUCKS' },
    { value: 'VOLVO_VM', label: 'VM', brand: 'VOLVO_TRUCKS' },

    // MERCEDES TRUCKS
    { value: 'MB_ACTROS', label: 'Actros', brand: 'MERCEDES_TRUCKS' },
    { value: 'MB_AXOR', label: 'Axor', brand: 'MERCEDES_TRUCKS' },
    { value: 'MB_ATEGO', label: 'Atego', brand: 'MERCEDES_TRUCKS' },
    { value: 'MB_ACCELO', label: 'Accelo', brand: 'MERCEDES_TRUCKS' },

    // SCANIA
    { value: 'SCANIA_R', label: 'Série R', brand: 'SCANIA' },
    { value: 'SCANIA_S', label: 'Série S', brand: 'SCANIA' },
    { value: 'SCANIA_G', label: 'Série G', brand: 'SCANIA' },
    { value: 'SCANIA_P', label: 'Série P', brand: 'SCANIA' },

    // MAN
    { value: 'MAN_TGX', label: 'TGX', brand: 'MAN' },
    { value: 'MAN_TGS', label: 'TGS', brand: 'MAN' },
    { value: 'MAN_TGL', label: 'TGL', brand: 'MAN' },
    { value: 'MAN_TGM', label: 'TGM', brand: 'MAN' },

    // DAF
    { value: 'DAF_XF', label: 'XF', brand: 'DAF' },
    { value: 'DAF_CF', label: 'CF', brand: 'DAF' },

    // HONDA MOTOS
    { value: 'HONDA_CG160', label: 'CG 160', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CG125', label: 'CG 125', brand: 'HONDA_MOTO' },
    { value: 'HONDA_BIZ', label: 'Biz', brand: 'HONDA_MOTO' },
    { value: 'HONDA_POP', label: 'Pop', brand: 'HONDA_MOTO' },
    { value: 'HONDA_NXR_BROS', label: 'NXR Bros', brand: 'HONDA_MOTO' },
    { value: 'HONDA_XRE300', label: 'XRE 300', brand: 'HONDA_MOTO' },
    { value: 'HONDA_XRE190', label: 'XRE 190', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CB500', label: 'CB 500', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CB650R', label: 'CB 650R', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CB1000R', label: 'CB 1000R', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CBR650R', label: 'CBR 650R', brand: 'HONDA_MOTO' },
    { value: 'HONDA_CBR1000', label: 'CBR 1000RR', brand: 'HONDA_MOTO' },
    { value: 'HONDA_AFRICA_TWIN', label: 'Africa Twin', brand: 'HONDA_MOTO' },
    { value: 'HONDA_NC750X', label: 'NC 750X', brand: 'HONDA_MOTO' },
    { value: 'HONDA_ELITE', label: 'Elite 125', brand: 'HONDA_MOTO' },
    { value: 'HONDA_PCX', label: 'PCX', brand: 'HONDA_MOTO' },
    { value: 'HONDA_ADV', label: 'ADV', brand: 'HONDA_MOTO' },
    { value: 'HONDA_SH300', label: 'SH 300i', brand: 'HONDA_MOTO' },

    // YAMAHA
    { value: 'YAMAHA_FACTOR', label: 'Factor', brand: 'YAMAHA' },
    { value: 'YAMAHA_FAZER', label: 'Fazer', brand: 'YAMAHA' },
    { value: 'YAMAHA_CROSSER', label: 'Crosser', brand: 'YAMAHA' },
    { value: 'YAMAHA_LANDER', label: 'Lander', brand: 'YAMAHA' },
    { value: 'YAMAHA_TENERE', label: 'Ténéré', brand: 'YAMAHA' },
    { value: 'YAMAHA_MT03', label: 'MT-03', brand: 'YAMAHA' },
    { value: 'YAMAHA_MT07', label: 'MT-07', brand: 'YAMAHA' },
    { value: 'YAMAHA_MT09', label: 'MT-09', brand: 'YAMAHA' },
    { value: 'YAMAHA_R3', label: 'YZF-R3', brand: 'YAMAHA' },
    { value: 'YAMAHA_R7', label: 'YZF-R7', brand: 'YAMAHA' },
    { value: 'YAMAHA_XTZ150', label: 'XTZ 150', brand: 'YAMAHA' },
    { value: 'YAMAHA_XTZ250', label: 'XTZ 250', brand: 'YAMAHA' },
    { value: 'YAMAHA_NMAX', label: 'NMAX', brand: 'YAMAHA' },
    { value: 'YAMAHA_NEO', label: 'Neo', brand: 'YAMAHA' },
    { value: 'YAMAHA_XMAX', label: 'XMAX', brand: 'YAMAHA' },
    { value: 'YAMAHA_TRACER', label: 'Tracer 900 GT', brand: 'YAMAHA' },

    // SUZUKI MOTOS
    { value: 'SUZUKI_GSX_S750', label: 'GSX-S750', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_GSX_S1000', label: 'GSX-S1000', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_VSTROM650', label: 'V-Strom 650', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_VSTROM1050', label: 'V-Strom 1050', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_HAYABUSA', label: 'Hayabusa', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_INTRUDER', label: 'Intruder', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_BOULEVARD', label: 'Boulevard', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_BURGMAN', label: 'Burgman', brand: 'SUZUKI_MOTO' },
    { value: 'SUZUKI_DL650', label: 'DL 650', brand: 'SUZUKI_MOTO' },

    // KAWASAKI
    { value: 'KAWASAKI_Z400', label: 'Z400', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_Z650', label: 'Z650', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_Z900', label: 'Z900', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_Z1000', label: 'Z1000', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_NINJA300', label: 'Ninja 300', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_NINJA400', label: 'Ninja 400', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_NINJA650', label: 'Ninja 650', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_NINJA1000', label: 'Ninja 1000', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_ZX10R', label: 'Ninja ZX-10R', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_VERSYS650', label: 'Versys 650', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_VERSYS1000', label: 'Versys 1000', brand: 'KAWASAKI' },
    { value: 'KAWASAKI_VULCAN', label: 'Vulcan', brand: 'KAWASAKI' },

    // BMW MOTOS
    { value: 'BMW_G310GS', label: 'G 310 GS', brand: 'BMW_MOTO' },
    { value: 'BMW_G310R', label: 'G 310 R', brand: 'BMW_MOTO' },
    { value: 'BMW_F750GS', label: 'F 750 GS', brand: 'BMW_MOTO' },
    { value: 'BMW_F850GS', label: 'F 850 GS', brand: 'BMW_MOTO' },
    { value: 'BMW_R1250GS', label: 'R 1250 GS', brand: 'BMW_MOTO' },
    { value: 'BMW_R1250RT', label: 'R 1250 RT', brand: 'BMW_MOTO' },
    { value: 'BMW_S1000RR', label: 'S 1000 RR', brand: 'BMW_MOTO' },
    { value: 'BMW_S1000XR', label: 'S 1000 XR', brand: 'BMW_MOTO' },
    { value: 'BMW_R18', label: 'R 18', brand: 'BMW_MOTO' },
    { value: 'BMW_C400GT', label: 'C 400 GT', brand: 'BMW_MOTO' },
    { value: 'BMW_CE04', label: 'CE 04', brand: 'BMW_MOTO' },

    // HARLEY-DAVIDSON
    { value: 'HARLEY_SPORTSTER', label: 'Sportster', brand: 'HARLEY' },
    { value: 'HARLEY_IRON883', label: 'Iron 883', brand: 'HARLEY' },
    { value: 'HARLEY_FORTY_EIGHT', label: 'Forty-Eight', brand: 'HARLEY' },
    { value: 'HARLEY_FAT_BOB', label: 'Fat Bob', brand: 'HARLEY' },
    { value: 'HARLEY_STREET_BOB', label: 'Street Bob', brand: 'HARLEY' },
    { value: 'HARLEY_LOW_RIDER', label: 'Low Rider', brand: 'HARLEY' },
    { value: 'HARLEY_ROAD_KING', label: 'Road King', brand: 'HARLEY' },
    { value: 'HARLEY_STREET_GLIDE', label: 'Street Glide', brand: 'HARLEY' },
    { value: 'HARLEY_ROAD_GLIDE', label: 'Road Glide', brand: 'HARLEY' },
    { value: 'HARLEY_ULTRA_LIMITED', label: 'Ultra Limited', brand: 'HARLEY' },
    { value: 'HARLEY_PAN_AMERICA', label: 'Pan America', brand: 'HARLEY' },
    { value: 'HARLEY_NIGHTSTER', label: 'Nightster', brand: 'HARLEY' },

    // TRIUMPH
    { value: 'TRIUMPH_STREET_TWIN', label: 'Street Twin', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_BONNEVILLE', label: 'Bonneville', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_SCRAMBLER', label: 'Scrambler', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_STREET_TRIPLE', label: 'Street Triple', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_SPEED_TRIPLE', label: 'Speed Triple', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_TIGER800', label: 'Tiger 800', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_TIGER900', label: 'Tiger 900', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_TIGER1200', label: 'Tiger 1200', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_TRIDENT', label: 'Trident 660', brand: 'TRIUMPH' },
    { value: 'TRIUMPH_ROCKET3', label: 'Rocket 3', brand: 'TRIUMPH' },

    // DUCATI
    { value: 'DUCATI_MONSTER', label: 'Monster', brand: 'DUCATI' },
    { value: 'DUCATI_SCRAMBLER', label: 'Scrambler', brand: 'DUCATI' },
    { value: 'DUCATI_MULTISTRADA', label: 'Multistrada', brand: 'DUCATI' },
    { value: 'DUCATI_PANIGALE', label: 'Panigale', brand: 'DUCATI' },
    { value: 'DUCATI_STREETFIGHTER', label: 'Streetfighter', brand: 'DUCATI' },
    { value: 'DUCATI_DIAVEL', label: 'Diavel', brand: 'DUCATI' },
    { value: 'DUCATI_HYPERMOTARD', label: 'Hypermotard', brand: 'DUCATI' },
    { value: 'DUCATI_DESERT_X', label: 'DesertX', brand: 'DUCATI' },

    // KTM
    { value: 'KTM_DUKE200', label: 'Duke 200', brand: 'KTM' },
    { value: 'KTM_DUKE390', label: 'Duke 390', brand: 'KTM' },
    { value: 'KTM_DUKE790', label: 'Duke 790', brand: 'KTM' },
    { value: 'KTM_DUKE890', label: 'Duke 890', brand: 'KTM' },
    { value: 'KTM_DUKE1290', label: 'Duke 1290', brand: 'KTM' },
    { value: 'KTM_ADV390', label: 'Adventure 390', brand: 'KTM' },
    { value: 'KTM_ADV890', label: 'Adventure 890', brand: 'KTM' },
    { value: 'KTM_ADV1290', label: 'Adventure 1290', brand: 'KTM' },
    { value: 'KTM_RC390', label: 'RC 390', brand: 'KTM' },

    // DAFRA
    { value: 'DAFRA_APACHE', label: 'Apache', brand: 'DAFRA' },
    { value: 'DAFRA_NEXT', label: 'Next', brand: 'DAFRA' },
    { value: 'DAFRA_RIVA', label: 'Riva', brand: 'DAFRA' },
    { value: 'DAFRA_CITYCOM', label: 'Citycom', brand: 'DAFRA' },
    { value: 'DAFRA_MAXSYM', label: 'Maxsym', brand: 'DAFRA' },
    { value: 'DAFRA_NH', label: 'NH', brand: 'DAFRA' },
    { value: 'DAFRA_HORIZON', label: 'Horizon', brand: 'DAFRA' },

    // SHINERAY
    { value: 'SHINERAY_JET', label: 'Jet', brand: 'SHINERAY' },
    { value: 'SHINERAY_PHOENIX', label: 'Phoenix', brand: 'SHINERAY' },
    { value: 'SHINERAY_WORKER', label: 'Worker', brand: 'SHINERAY' },
    { value: 'SHINERAY_XY', label: 'XY', brand: 'SHINERAY' },

    // OUTRO
    { value: 'OUTRO_MODELO', label: 'Outro modelo', brand: 'OUTRO' },
];

// Função para obter modelos por marca
export function getModelsByBrand(brandValue: string): VehicleModel[] {
    return vehicleModels.filter((model) => model.brand === brandValue);
}

// Função para obter o label da marca pelo value (busca em todas as listas)
export function getBrandLabel(brandValue: string): string {
    // Busca em todas as listas de marcas
    const allBrands = [...carBrands, ...vanBrands, ...truckBrands, ...motorcycleBrands];
    const brand = allBrands.find((b) => b.value === brandValue);
    return brand ? brand.label : brandValue;
}

// Função para obter o label do modelo pelo value
export function getModelLabel(modelValue: string): string {
    const model = vehicleModels.find((m) => m.value === modelValue);
    return model ? model.label : modelValue;
}
