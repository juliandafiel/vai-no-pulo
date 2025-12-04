import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'juliandafiel@gmail.com';
    const newPassword = '123456';

    try {
        // Hash da nova senha
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Atualiza a senha do usuário
        const user = await prisma.user.update({
            where: { email },
            data: { passwordHash },
        });

        console.log(`✅ Senha resetada para o usuário: ${user.email}`);
        console.log(`Nova senha: ${newPassword}`);
    } catch (error) {
        console.error('❌ Erro ao resetar senha:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
