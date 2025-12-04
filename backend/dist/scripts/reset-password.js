"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function resetPassword() {
    const email = 'juliandafiel@gmail.com';
    const newPassword = '123456';
    try {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const user = await prisma.user.update({
            where: { email },
            data: { passwordHash },
        });
        console.log(`✅ Senha resetada para o usuário: ${user.email}`);
        console.log(`Nova senha: ${newPassword}`);
    }
    catch (error) {
        console.error('❌ Erro ao resetar senha:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
resetPassword();
//# sourceMappingURL=reset-password.js.map