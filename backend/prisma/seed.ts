import { PrismaClient, UserRole, ProfileStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = '51025102';
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // Admin
    const adminEmail = 'admin@test.com';
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            profileStatus: ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: adminEmail,
            name: 'Admin User',
            passwordHash,
            role: UserRole.ADMIN,
            verifiedEmail: true,
            profileStatus: ProfileStatus.APPROVED,
        },
    });
    console.log('Admin created/updated:', admin.email);

    // Driver
    const driverEmail = 'driver@test.com';
    const driver = await prisma.user.upsert({
        where: { email: driverEmail },
        update: {
            profileStatus: ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: driverEmail,
            name: 'Driver User',
            passwordHash,
            role: UserRole.DRIVER,
            verifiedEmail: true,
            profileStatus: ProfileStatus.APPROVED,
        },
    });
    console.log('Driver created/updated:', driver.email);

    // Client (User)
    const clientEmail = 'client@test.com';
    const client = await prisma.user.upsert({
        where: { email: clientEmail },
        update: {
            profileStatus: ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: clientEmail,
            name: 'Client User',
            passwordHash,
            role: UserRole.USER,
            verifiedEmail: true,
            profileStatus: ProfileStatus.APPROVED,
        },
    });
    console.log('Client created/updated:', client.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
