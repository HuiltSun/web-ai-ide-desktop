/**
 * 添加管理员账户脚本
 * 用法：tsx scripts/add-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@web.local';
const ADMIN_PASSWORD = '123456789';
const ADMIN_NAME = 'Administrator';

async function addAdmin() {
  try {
    // 检查是否已存在该邮箱的用户
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingUser) {
      console.log('管理员账户已存在:', existingUser.email);
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // 创建管理员账户
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
      },
    });

    console.log('✅ 管理员账户创建成功!');
    console.log('邮箱:', admin.email);
    console.log('ID:', admin.id);
    console.log('创建时间:', admin.createdAt);
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAdmin();
