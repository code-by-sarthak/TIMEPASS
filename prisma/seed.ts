import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@timepass.chat',
      username: 'admin',
      displayName: 'Timepass Overseer',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminBoss',
      profile: {
        create: {
          country: 'United States',
          languages: 'English,Spanish',
          interests: 'Technology,Coding,Cybersecurity',
          bio: 'Platform Administrator & Community Safety Guardian',
          ageConfirmed: true,
          preferredChatMode: 'video',
        }
      }
    }
  });

  // 2. Moderator Account
  const mod = await prisma.user.create({
    data: {
      email: 'moderator@timepass.chat',
      username: 'mod_alex',
      displayName: 'Alex Rivers',
      passwordHash: userPasswordHash,
      role: 'MODERATOR',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexRivers',
      profile: {
        create: {
          country: 'Canada',
          languages: 'English,French',
          interests: 'Gaming,Movies,Music',
          bio: 'Keeping Timepass fun, respectful, and safe for everyone.',
          ageConfirmed: true,
          preferredChatMode: 'video',
        }
      }
    }
  });

  // 3. Demo Users
  const user1 = await prisma.user.create({
    data: {
      email: 'elena@example.com',
      username: 'elena_v',
      displayName: 'Elena Vance',
      passwordHash: userPasswordHash,
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ElenaVance',
      profile: {
        create: {
          country: 'Spain',
          languages: 'English,Spanish',
          interests: 'Travel,Photography,Art & Design,Music',
          bio: 'Digital nomad exploring Europe. Love talking about architecture and indie music!',
          ageConfirmed: true,
          preferredChatMode: 'video',
        }
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'kenji@example.com',
      username: 'kenji_tokyo',
      displayName: 'Kenji Sato',
      passwordHash: userPasswordHash,
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=KenjiSato',
      profile: {
        create: {
          country: 'Japan',
          languages: 'Japanese,English',
          interests: 'Gaming,Anime,Coding,Technology',
          bio: 'Indie game developer & retro arcade fan. Let us chat about tech and animation!',
          ageConfirmed: true,
          preferredChatMode: 'video',
        }
      }
    }
  });

  const spammer = await prisma.user.create({
    data: {
      email: 'spammer_bob@example.com',
      username: 'bot_bob',
      displayName: 'Suspicious Bob',
      passwordHash: userPasswordHash,
      role: 'USER',
      isBanned: false,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SpamBob',
      profile: {
        create: {
          country: 'United States',
          languages: 'English',
          interests: 'Crypto & Web3',
          bio: 'Free crypto giveaway links!',
          ageConfirmed: true,
          preferredChatMode: 'text',
        }
      }
    }
  });

  // Create Sample Report for Admin Dashboard Demo
  await prisma.report.create({
    data: {
      reporterId: user1.id,
      reportedUserId: spammer.id,
      reason: 'Spam and Commercial Promotion',
      details: 'User repeatedly sent scam links and automated text in chat without talking.',
      status: 'PENDING',
    }
  });

  await prisma.report.create({
    data: {
      reporterId: user2.id,
      reportedUserId: spammer.id,
      reason: 'Inappropriate or Offensive Behavior',
      details: 'Refused to follow community standards.',
      status: 'PENDING',
    }
  });

  console.log('✅ Seed completed successfully:');
  console.log('   Admin: admin@timepass.chat (Password: admin123)');
  console.log('   Mod:   moderator@timepass.chat (Password: password123)');
  console.log('   User:  elena@example.com (Password: password123)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
