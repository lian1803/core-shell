import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_USER_EMAIL || 'admin@example.com'
  const password = process.env.SEED_USER_PASSWORD || 'admin123'
  const name = process.env.SEED_USER_NAME || '관리자'

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('User already exists:', email)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  })

  console.log('Created user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
