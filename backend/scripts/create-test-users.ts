import { PrismaClient, UserRole, ProfileStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar motorista pendente 1
    const driver1 = await prisma.user.create({
        data: {
            email: 'motorista1@test.com',
            name: 'João Silva',
            phone: '(11) 98765-4321',
            passwordHash,
            role: UserRole.DRIVER,
            profileStatus: ProfileStatus.PENDING,
            verifiedEmail: true,
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            birthDate: '15/05/1985',
            cnh: '12345678901',
            cnhCategory: 'D',
            cnhExpiry: '15/05/2027',
        },
    });
    console.log('Motorista 1 criado:', driver1.email);

    // Criar motorista pendente 2
    const driver2 = await prisma.user.create({
        data: {
            email: 'motorista2@test.com',
            name: 'Maria Santos',
            phone: '(11) 91234-5678',
            passwordHash,
            role: UserRole.DRIVER,
            profileStatus: ProfileStatus.PENDING,
            verifiedEmail: true,
            cpf: '987.654.321-00',
            rg: '98.765.432-1',
            birthDate: '20/08/1990',
            cnh: '98765432109',
            cnhCategory: 'E',
            cnhExpiry: '20/08/2026',
        },
    });
    console.log('Motorista 2 criado:', driver2.email);

    // Criar cliente pendente
    const client = await prisma.user.create({
        data: {
            email: 'cliente1@test.com',
            name: 'Pedro Oliveira',
            phone: '(11) 99999-8888',
            passwordHash,
            role: UserRole.USER,
            profileStatus: ProfileStatus.PENDING,
            verifiedEmail: true,
        },
    });
    console.log('Cliente criado:', client.email);

    console.log('\n✅ Usuários de teste criados com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
