const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@spshealth.com';
  
  const existe = await prisma.user.findUnique({ where: { email } });
  
  if (!existe) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await prisma.user.create({
      data: {
        email,
        nombre: 'Administrador Principal',
        rol: 'admin',
        passwordHash
      }
    });
    console.log('Usuario administrador creado: admin@spshealth.com / admin123');
  } else {
    console.log('El administrador ya existe');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
