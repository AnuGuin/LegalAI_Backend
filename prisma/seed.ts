import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      provider: 'LOCAL',
    },
  });

  console.log('Created test user:', user.email);

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Contract Review Inquiry',
      mode: 'NORMAL',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Can you help me review an employment contract?',
          },
          {
            role: 'ASSISTANT',
            content:
              'Of course! I\'d be happy to help you review your employment contract. Please share the document or specific clauses you\'d like me to analyze.',
          },
        ],
      },
    },
  });

  console.log('Created sample conversation:', conversation.id);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
