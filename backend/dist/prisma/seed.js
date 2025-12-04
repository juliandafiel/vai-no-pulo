"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const password = '51025102';
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    const adminEmail = 'admin@test.com';
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            profileStatus: client_1.ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: adminEmail,
            name: 'Admin User',
            passwordHash,
            role: client_1.UserRole.ADMIN,
            verifiedEmail: true,
            profileStatus: client_1.ProfileStatus.APPROVED,
        },
    });
    console.log('Admin created/updated:', admin.email);
    const driverEmail = 'driver@test.com';
    const driver = await prisma.user.upsert({
        where: { email: driverEmail },
        update: {
            profileStatus: client_1.ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: driverEmail,
            name: 'Driver User',
            passwordHash,
            role: client_1.UserRole.DRIVER,
            verifiedEmail: true,
            profileStatus: client_1.ProfileStatus.APPROVED,
        },
    });
    console.log('Driver created/updated:', driver.email);
    const clientEmail = 'client@test.com';
    const client = await prisma.user.upsert({
        where: { email: clientEmail },
        update: {
            profileStatus: client_1.ProfileStatus.APPROVED,
            verifiedEmail: true,
        },
        create: {
            email: clientEmail,
            name: 'Client User',
            passwordHash,
            role: client_1.UserRole.USER,
            verifiedEmail: true,
            profileStatus: client_1.ProfileStatus.APPROVED,
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
//# sourceMappingURL=seed.js.map