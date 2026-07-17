const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  const adminEmail = 'admin@breakoutmusic.online'; // You can change this
  const adminUsername = 'Avelin11';
  
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!existingAdmin) {
    // Generate secure temporary password
    const tempPassword = 'ChangeMe123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminUsername,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        admin: {
          create: {
            level: 'SUPERADMIN',
          }
        }
      },
    });
    console.log(`Created default admin: ${user.name} (${user.email}) - Password: ${tempPassword}`);
    console.log('PLEASE CHANGE YOUR PASSWORD ON FIRST LOGIN');
  } else {
    console.log('Admin already exists.');
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
