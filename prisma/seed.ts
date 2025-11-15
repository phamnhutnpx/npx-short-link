import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@tiny-url.local';
  const adminPassword = 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Seed Admin',
      hashedPassword
    }
  });

  const links = [
    {
      slug: 'docs',
      destination: 'https://url.npxofficial.com/docs',
      title: 'Documentation placeholder',
      utmSource: 'seed',
      createdById: adminUser.id
    },
    {
      slug: 'launch',
      destination: 'https://example.com/product-launch',
      title: 'Product launch',
      utmSource: 'campaign',
      utmMedium: 'email',
      utmCampaign: 'launch-2025',
      createdById: adminUser.id
    }
  ];

  for (const link of links) {
    await prisma.link.upsert({
      where: { slug: link.slug },
      update: {},
      create: link
    });
  }

  console.log('Seed completed. Admin email:', adminEmail);
  console.log('Temporary admin password:', adminPassword);
  console.log('Remember to rotate the admin password and ADMIN_TOKEN immediately in production.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
