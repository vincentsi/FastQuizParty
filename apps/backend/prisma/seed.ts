import { PrismaClient, Role, Difficulty } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password for test users (simplified for dev: test123)
  const hashedPassword = await bcrypt.hash('test123', 10)

  // Create test user (for E2E tests)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: Role.USER,
      emailVerified: true,
    },
  })
  console.log('✅ Created test user:', testUser.email)

  // Create free user (for subscription tests)
  const freeUser = await prisma.user.upsert({
    where: { email: 'freeuser@example.com' },
    update: {},
    create: {
      email: 'freeuser@example.com',
      password: hashedPassword,
      name: 'Free User',
      role: Role.USER,
      emailVerified: true,
      planType: 'FREE',
    },
  })
  console.log('✅ Created free user:', freeUser.email)

  // Create PRO user (for subscription tests)
  const proUser = await prisma.user.upsert({
    where: { email: 'prouser@example.com' },
    update: {},
    create: {
      email: 'prouser@example.com',
      password: hashedPassword,
      name: 'PRO User',
      role: Role.USER,
      emailVerified: true,
      planType: 'PRO',
    },
  })
  console.log('✅ Created PRO user:', proUser.email)

  // Create admin user (for admin tests)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      emailVerified: true,
      planType: 'BUSINESS',
    },
  })
  console.log('✅ Created admin user:', adminUser.email)

  // ============================================
  // Quiz Categories
  // ============================================
  console.log('📂 Creating quiz categories...')

  const categories = [
    {
      name: 'Culture Générale',
      slug: 'culture-generale',
      icon: '📚',
      color: '#3B82F6',
    },
    {
      name: 'Sciences',
      slug: 'sciences',
      icon: '🔬',
      color: '#10B981',
    },
    {
      name: 'Histoire',
      slug: 'histoire',
      icon: '🏛️',
      color: '#F59E0B',
    },
    {
      name: 'Géographie',
      slug: 'geographie',
      icon: '🗺️',
      color: '#8B5CF6',
    },
    {
      name: 'Sports',
      slug: 'sports',
      icon: '⚽',
      color: '#EF4444',
    },
    {
      name: 'Cinéma & TV',
      slug: 'cinema-tv',
      icon: '🎬',
      color: '#EC4899',
    },
    {
      name: 'Musique',
      slug: 'musique',
      icon: '🎵',
      color: '#06B6D4',
    },
    {
      name: 'Jeux Vidéo',
      slug: 'jeux-video',
      icon: '🎮',
      color: '#6366F1',
    },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('✅ Created categories:', categories.length)

  // ============================================
  // Sample Quizzes
  // ============================================
  console.log('📝 Creating sample quizzes...')

  const cultureGeneraleCategory = await prisma.category.findUnique({
    where: { slug: 'culture-generale' },
  })

  const sciencesCategory = await prisma.category.findUnique({
    where: { slug: 'sciences' },
  })

  // Quiz 1: Culture Générale
  const quiz1 = await prisma.quiz.upsert({
    where: { id: 'quiz-culture-generale-1' },
    update: {},
    create: {
      id: 'quiz-culture-generale-1',
      title: 'Culture Générale - Niveau Facile',
      description: 'Un quiz de culture générale pour tous les niveaux',
      authorId: testUser.id,
      categoryId: cultureGeneraleCategory?.id,
      isPublic: true,
      difficulty: Difficulty.EASY,
      tags: ['culture', 'facile', 'débutant'],
      questions: {
        create: [
          {
            text: 'Quelle est la capitale de la France ?',
            options: JSON.stringify(['Paris', 'Lyon', 'Marseille', 'Toulouse']),
            correctAnswer: 0,
            difficulty: Difficulty.EASY,
            timeLimit: 15,
            points: 1000,
            order: 1,
            explanation: 'Paris est la capitale de la France depuis 987.',
          },
          {
            text: 'Combien de continents y a-t-il sur Terre ?',
            options: JSON.stringify(['5', '6', '7', '8']),
            correctAnswer: 2,
            difficulty: Difficulty.EASY,
            timeLimit: 15,
            points: 1000,
            order: 2,
            explanation: 'Il y a 7 continents: Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe et Océanie.',
          },
          {
            text: 'Quel est le plus grand océan du monde ?',
            options: JSON.stringify(['Atlantique', 'Indien', 'Arctique', 'Pacifique']),
            correctAnswer: 3,
            difficulty: Difficulty.EASY,
            timeLimit: 15,
            points: 1000,
            order: 3,
            explanation: 'L\'océan Pacifique est le plus grand et le plus profond des océans.',
          },
          {
            text: 'Qui a peint la Joconde ?',
            options: JSON.stringify([
              'Pablo Picasso',
              'Leonardo da Vinci',
              'Vincent van Gogh',
              'Claude Monet',
            ]),
            correctAnswer: 1,
            difficulty: Difficulty.EASY,
            timeLimit: 15,
            points: 1000,
            order: 4,
            explanation: 'La Joconde a été peinte par Leonardo da Vinci au début du 16e siècle.',
          },
          {
            text: 'Combien de jours y a-t-il dans une année bissextile ?',
            options: JSON.stringify(['365', '366', '364', '367']),
            correctAnswer: 1,
            difficulty: Difficulty.EASY,
            timeLimit: 15,
            points: 1000,
            order: 5,
            explanation: 'Une année bissextile compte 366 jours, avec un jour supplémentaire le 29 février.',
          },
        ],
      },
    },
  })

  console.log('✅ Created quiz:', quiz1.title)

  // Quiz 2: Sciences
  const quiz2 = await prisma.quiz.upsert({
    where: { id: 'quiz-sciences-1' },
    update: {},
    create: {
      id: 'quiz-sciences-1',
      title: 'Sciences - Niveau Moyen',
      description: 'Testez vos connaissances scientifiques',
      authorId: adminUser.id,
      categoryId: sciencesCategory?.id,
      isPublic: true,
      difficulty: Difficulty.MEDIUM,
      tags: ['sciences', 'moyen', 'physique', 'chimie'],
      questions: {
        create: [
          {
            text: 'Quel est le symbole chimique de l\'or ?',
            options: JSON.stringify(['Go', 'Au', 'Or', 'Ag']),
            correctAnswer: 1,
            difficulty: Difficulty.MEDIUM,
            timeLimit: 20,
            points: 1500,
            order: 1,
            explanation: 'Au vient du latin "aurum" qui signifie or.',
          },
          {
            text: 'Quelle est la vitesse de la lumière dans le vide ?',
            options: JSON.stringify([
              '300 000 km/s',
              '150 000 km/s',
              '500 000 km/s',
              '1 000 000 km/s',
            ]),
            correctAnswer: 0,
            difficulty: Difficulty.MEDIUM,
            timeLimit: 20,
            points: 1500,
            order: 2,
            explanation: 'La lumière se déplace à environ 299 792 km/s dans le vide.',
          },
          {
            text: 'Combien de planètes composent notre système solaire ?',
            options: JSON.stringify(['7', '8', '9', '10']),
            correctAnswer: 1,
            difficulty: Difficulty.MEDIUM,
            timeLimit: 20,
            points: 1500,
            order: 3,
            explanation: 'Il y a 8 planètes depuis que Pluton a été reclassée comme planète naine en 2006.',
          },
          {
            text: 'Quel est le plus grand organe du corps humain ?',
            options: JSON.stringify(['Le foie', 'Le cerveau', 'La peau', 'Les poumons']),
            correctAnswer: 2,
            difficulty: Difficulty.MEDIUM,
            timeLimit: 20,
            points: 1500,
            order: 4,
            explanation: 'La peau est le plus grand organe avec une surface d\'environ 2 m².',
          },
        ],
      },
    },
  })

  console.log('✅ Created quiz:', quiz2.title)

  // Quiz 3: Private quiz (for testing ownership)
  const quiz3 = await prisma.quiz.upsert({
    where: { id: 'quiz-private-1' },
    update: {},
    create: {
      id: 'quiz-private-1',
      title: 'Quiz Privé - Test',
      description: 'Ce quiz est privé pour tester les permissions',
      authorId: testUser.id,
      categoryId: cultureGeneraleCategory?.id,
      isPublic: false,
      difficulty: Difficulty.MEDIUM,
      tags: ['test', 'privé'],
      questions: {
        create: [
          {
            text: 'Question test privée',
            options: JSON.stringify(['Option 1', 'Option 2', 'Option 3', 'Option 4']),
            correctAnswer: 0,
            difficulty: Difficulty.MEDIUM,
            timeLimit: 15,
            points: 1000,
            order: 1,
          },
        ],
      },
    },
  })

  console.log('✅ Created private quiz:', quiz3.title)

  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
