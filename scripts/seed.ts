import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Default admin/test user
  const password = await bcrypt.hash('johndoe123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password,
    },
  })

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      sourceFolder: 'Plati',
      destinationFolder: 'ReturnedPlati',
      recipientEmail: 'celaplata@ujp.gov.mk',
    },
  })

  console.log('Seed complete. Default user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
