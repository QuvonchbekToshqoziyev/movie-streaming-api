import {
  PrismaClient,
  Role,
  Status,
  PaymentMethod,
  PaymentStatus,
  MovieQuality,
  MovieType,
  SubscriptionStatus,
  type Profile,
  type User,
  type SubscriptionPlan,
  type Category,
  type Movies,
  type ProfileSubscription,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Create 10 profiles (regular users) ──
  const profileData = [
    { username: 'alijon', email: 'alijon@example.com', full_name: 'Aliyev Alijon', phone: '+998901234501', country: 'Uzbekistan' },
    { username: 'bobur', email: 'bobur@example.com', full_name: 'Boburov Bobur', phone: '+998901234502', country: 'Uzbekistan' },
    { username: 'charos', email: 'charos@example.com', full_name: 'Charosova Charos', phone: '+998901234503', country: 'Uzbekistan' },
    { username: 'davron', email: 'davron@example.com', full_name: 'Davronov Davron', phone: '+998901234504', country: 'Uzbekistan' },
    { username: 'eldor', email: 'eldor@example.com', full_name: 'Eldorov Eldor', phone: '+998901234505', country: 'Kazakhstan' },
    { username: 'farida', email: 'farida@example.com', full_name: 'Faridaxon Tosheva', phone: '+998901234506', country: 'Uzbekistan' },
    { username: 'gulnora', email: 'gulnora@example.com', full_name: 'Gulnora Karimova', phone: '+998901234507', country: 'Uzbekistan' },
    { username: 'husan', email: 'husan@example.com', full_name: 'Husanov Husan', phone: '+998901234508', country: 'Tajikistan' },
    { username: 'iroda', email: 'iroda@example.com', full_name: 'Irodaxon Saidova', phone: '+998901234509', country: 'Uzbekistan' },
    { username: 'jasur', email: 'jasur@example.com', full_name: 'Jasurov Jasur', phone: '+998901234510', country: 'Uzbekistan' },
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);

  const profiles: Profile[] = [];
  for (const p of profileData) {
    profiles.push(
      await prisma.profile.upsert({
        where: { email: p.email },
        update: {},
        create: {
          username: p.username,
          email: p.email,
          password: hashedPassword,
          role: Role.USER,
          full_name: p.full_name,
          phone: p.phone,
          country: p.country,
          avatar_url: '',
          status: Status.ACTIVE,
        },
      }),
    );
  }
  console.log(`✅ Created ${profiles.length} profiles`);

  // ── 2. Create 5 admin/superadmin users ──
  const adminHashedPassword = await bcrypt.hash('adminpass123', 10);

  const adminData = [
    { username: 'superadmin', email: 'superadmin@example.com', role: Role.SUPERADMIN },
    { username: 'admin1', email: 'admin1@example.com', role: Role.ADMIN },
    { username: 'admin2', email: 'admin2@example.com', role: Role.ADMIN },
    { username: 'admin3', email: 'admin3@example.com', role: Role.ADMIN },
    { username: 'admin4', email: 'admin4@example.com', role: Role.ADMIN },
  ];

  const users: User[] = [];
  for (const a of adminData) {
    users.push(
      await prisma.user.upsert({
        where: { email: a.email },
        update: {},
        create: {
          username: a.username,
          email: a.email,
          password: adminHashedPassword,
          role: a.role,
          status: Status.ACTIVE,
        },
      }),
    );
  }
  console.log(`✅ Created ${users.length} admin users`);

  // ── 3. Create 4 subscription plans ──
  const planData = [
    {
      name: 'Start',
      price: 0,
      duration_days: 0,
      features: ['SD sifatli kinolar', 'Reklama bilan', 'Faqat bepul kinolar'],
      allowed_qualities: [MovieQuality.P240, MovieQuality.P360],
    },
    {
      name: 'Pro',
      price: 29.99,
      duration_days: 30,
      features: ['HD sifatli kinolar', 'Reklamasiz', 'Barcha kinolar'],
      allowed_qualities: [MovieQuality.P240, MovieQuality.P360, MovieQuality.P480, MovieQuality.P720],
    },
    {
      name: 'Extra Pro',
      price: 59.99,
      duration_days: 90,
      features: ['Full HD sifatli kinolar', 'Reklamasiz', 'Barcha kinolar', 'Offline yuklab olish'],
      allowed_qualities: [MovieQuality.P240, MovieQuality.P360, MovieQuality.P480, MovieQuality.P720, MovieQuality.P1080],
    },
    {
      name: 'Daxshat',
      price: 99.99,
      duration_days: 365,
      features: ['4K sifatli kinolar', 'Reklamasiz', 'Barcha kinolar', 'Offline yuklab olish', 'Bir nechta qurilma', "Birinchi bo'lib yangi kinolar"],
      allowed_qualities: [MovieQuality.P240, MovieQuality.P360, MovieQuality.P480, MovieQuality.P720, MovieQuality.P1080, MovieQuality.P4K],
    },
  ];

  const plans: SubscriptionPlan[] = [];
  for (const pl of planData) {
    plans.push(
      await prisma.subscriptionPlan.upsert({
        where: { name: pl.name },
        update: {},
        create: {
          name: pl.name,
          price: pl.price,
          duration_days: pl.duration_days,
          features: pl.features,
          allowed_qualities: pl.allowed_qualities,
          is_active: true,
        },
      }),
    );
  }
  console.log(`✅ Created ${plans.length} subscription plans`);

  // ── 4. Create 10 categories ──
  const categoryData = [
    { name: 'Action', slug: 'action', description: 'Jangari va hayajonli filmlar' },
    { name: 'Comedy', slug: 'comedy', description: 'Kulgili va yengil filmlar' },
    { name: 'Drama', slug: 'drama', description: 'Dramatik va hissiy filmlar' },
    { name: 'Horror', slug: 'horror', description: "Qo'rqinchli filmlar" },
    { name: 'Sci-Fi', slug: 'sci-fi', description: 'Ilmiy-fantastik filmlar' },
    { name: 'Romance', slug: 'romance', description: 'Ishqiy filmlar' },
    { name: 'Thriller', slug: 'thriller', description: 'Hayajonli va sirli filmlar' },
    { name: 'Adventure', slug: 'adventure', description: 'Sarguzasht filmlar' },
    { name: 'Animation', slug: 'animation', description: 'Animatsion filmlar' },
    { name: 'Documentary', slug: 'documentary', description: 'Hujjatli filmlar' },
  ];

  const categories: Category[] = [];
  for (const c of categoryData) {
    categories.push(
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: {
          name: c.name,
          slug: c.slug,
          description: c.description,
        },
      }),
    );
  }
  console.log(`✅ Created ${categories.length} categories`);

  // ── 5. Create 20 movies ──
  const movieData = [
    { title: "Qasoskorlar: Abadiyat Jangi", slug: "qasoskorlar-abadiyat-jangi", description: "Qasoskorlar va ularning ittifoqchilari Yerning eng katta xavfi bilan to'qnashishadi.", releaseDate: new Date('2018-04-27'), duration: 149, country: 'USA', genre: 'Action', rating: 8.5, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [0, 7, 4] },
    { title: "Qasoskorlar: Yakuniy o'yin", slug: "qasoskorlar-yakuniy-oyin", description: "Qolgan Qasoskorlar Tanossiz o'z ishlarini tugallash uchun oxirgi marta birga ishlaydilar.", releaseDate: new Date('2019-04-26'), duration: 181, country: 'USA', genre: 'Action', rating: 8.7, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 7, 2] },
    { title: "Inception", slug: "inception", description: "Tush o'g'risi korporativ josuslik texnologiyasining eng so'nggi san'atiga ega bo'ladi.", releaseDate: new Date('2010-07-16'), duration: 148, country: 'USA', genre: 'Sci-Fi', rating: 8.8, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 4, 6] },
    { title: "Interstellar", slug: "interstellar", description: "Insoniyat eng katta sarguzashtiga chiqadi - yulduzlarga sayohat.", releaseDate: new Date('2014-11-07'), duration: 169, country: 'USA', genre: 'Sci-Fi', rating: 8.6, subIdx: 2, movieType: MovieType.PAID, categoryIdxs: [4, 7, 2] },
    { title: "Parasite", slug: "parasite", description: "Kim oilasi boy Park oilasining hayotiga aralashadi.", releaseDate: new Date('2019-05-30'), duration: 132, country: 'South Korea', genre: 'Thriller', rating: 8.5, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [2, 6] },
    { title: "The Dark Knight", slug: "the-dark-knight", description: "Batman Jokerga qarshi kurashadi.", releaseDate: new Date('2008-07-18'), duration: 152, country: 'USA', genre: 'Action', rating: 9.0, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 2, 6] },
    { title: "Forrest Gump", slug: "forrest-gump", description: "Forrest Gumpning ajoyib hayoti.", releaseDate: new Date('1994-07-06'), duration: 142, country: 'USA', genre: 'Drama', rating: 8.8, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [1, 2, 5] },
    { title: "The Matrix", slug: "the-matrix", description: "Haqiqat nima ekanligini kashf eting.", releaseDate: new Date('1999-03-31'), duration: 136, country: 'USA', genre: 'Sci-Fi', rating: 8.7, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 4] },
    { title: "Spirited Away", slug: "spirited-away", description: "Chihiro arvohlar dunyosiga tushib qoladi.", releaseDate: new Date('2001-07-20'), duration: 125, country: 'Japan', genre: 'Animation', rating: 8.6, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [7, 8] },
    { title: "Gladiator", slug: "gladiator", description: "Maximus Rim arenasida kurashadi.", releaseDate: new Date('2000-05-05'), duration: 155, country: 'USA', genre: 'Action', rating: 8.5, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 2, 7] },
    { title: "Joker", slug: "joker", description: "Arthur Fleckning Jokerga aylanishi.", releaseDate: new Date('2019-10-04'), duration: 122, country: 'USA', genre: 'Drama', rating: 8.4, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [2, 6] },
    { title: "Toy Story 4", slug: "toy-story-4", description: "Vuddi va do'stlarining yangi sarguzashtlari.", releaseDate: new Date('2019-06-21'), duration: 100, country: 'USA', genre: 'Animation', rating: 7.8, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [1, 8, 7] },
    { title: "Dune", slug: "dune", description: "Pol Atreidesning kosmik sarguzashti.", releaseDate: new Date('2021-10-22'), duration: 155, country: 'USA', genre: 'Sci-Fi', rating: 8.0, subIdx: 2, movieType: MovieType.PAID, categoryIdxs: [4, 7, 2] },
    { title: "Oppenheimer", slug: "oppenheimer", description: "Atom bombasini yaratgan olimning hayoti.", releaseDate: new Date('2023-07-21'), duration: 180, country: 'USA', genre: 'Drama', rating: 8.5, subIdx: 3, movieType: MovieType.PAID, categoryIdxs: [2, 9] },
    { title: "Spider-Man: No Way Home", slug: "spider-man-no-way-home", description: "Piter Parker multiverse bilan to'qnash keladi.", releaseDate: new Date('2021-12-17'), duration: 148, country: 'USA', genre: 'Action', rating: 8.3, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [0, 7, 4] },
    { title: "Coco", slug: "coco", description: "Migel musiqa orzu bilan o'liklar dunyosiga tushadi.", releaseDate: new Date('2017-11-22'), duration: 105, country: 'USA', genre: 'Animation', rating: 8.4, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [8, 7, 2] },
    { title: "John Wick", slug: "john-wick", description: "Nafaqaga chiqqan qotil o'ch olish yo'liga tushdi.", releaseDate: new Date('2014-10-24'), duration: 101, country: 'USA', genre: 'Action', rating: 7.4, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [0, 6] },
    { title: "Get Out", slug: "get-out", description: "Kris qora tanli yigit qo'rqinchli sirni ochadi.", releaseDate: new Date('2017-02-24'), duration: 104, country: 'USA', genre: 'Horror', rating: 7.7, subIdx: 1, movieType: MovieType.PAID, categoryIdxs: [3, 6] },
    { title: "Your Name", slug: "your-name", description: "Ikki yoshlar sirli tarzda jism almashadi.", releaseDate: new Date('2016-08-26'), duration: 106, country: 'Japan', genre: 'Animation', rating: 8.4, subIdx: 0, movieType: MovieType.FREE, categoryIdxs: [5, 8, 2] },
    { title: "Planet Earth II", slug: "planet-earth-ii", description: "Yerdagi tabiat mo''jizalari.", releaseDate: new Date('2016-11-06'), duration: 300, country: 'UK', genre: 'Documentary', rating: 9.5, subIdx: 3, movieType: MovieType.PAID, categoryIdxs: [9] },
  ];

  const movies: Movies[] = [];
  for (let i = 0; i < movieData.length; i++) {
    const m = movieData[i];
    movies.push(
      await prisma.movies.upsert({
        where: { slug: m.slug },
        update: {},
        create: {
          title: m.title,
          slug: m.slug,
          description: m.description,
          releaseDate: m.releaseDate,
          duration: m.duration,
          country: m.country,
          posterUrl: `https://example.com/posters/${m.slug}.jpg`,
          genre: m.genre,
          rating: m.rating,
          movieType: m.movieType,
          subscriptionPlanId: plans[m.subIdx].id,
          createdBy: users[i % users.length].id,
        },
      }),
    );
  }
  console.log(`✅ Created ${movies.length} movies`);

  // ── 6. Link movies to categories ──
  let mcCount = 0;
  for (let i = 0; i < movieData.length; i++) {
    for (const catIdx of movieData[i].categoryIdxs) {
      await prisma.movieCategories.upsert({
        where: {
          movieId_categoryId: {
            movieId: movies[i].id,
            categoryId: categories[catIdx].id,
          },
        },
        update: {},
        create: {
          movieId: movies[i].id,
          categoryId: categories[catIdx].id,
        },
      });
      mcCount++;
    }
  }
  console.log(`✅ Created ${mcCount} movie-category links`);

  // ── 7. Add movie files (multiple qualities per movie) ──
  let mfCount = 0;
  const qualities = [MovieQuality.P480, MovieQuality.P720, MovieQuality.P1080];
  for (let i = 0; i < movies.length; i++) {
    for (const q of qualities) {
      const existing = await prisma.movieFile.findFirst({
        where: { movieId: movies[i].id, quality: q },
      });
      if (!existing) {
        await prisma.movieFile.create({
          data: {
            movieId: movies[i].id,
            quality: q,
            fileUrl: `https://example.com/movies/${movies[i].slug}-${q}.mp4`,
            language: 'uzbek',
          },
        });
        mfCount++;
      }
    }
  }
  console.log(`✅ Created ${mfCount} movie files`);

  // ── 8. Add favorites ──
  let favCount = 0;
  for (let i = 0; i < profiles.length; i++) {
    const favMovies = [movies[i % movies.length], movies[(i + 3) % movies.length]];
    for (const fm of favMovies) {
      await prisma.favorite.upsert({
        where: { profileId_movieId: { profileId: profiles[i].id, movieId: fm.id } },
        update: {},
        create: { profileId: profiles[i].id, movieId: fm.id },
      });
      favCount++;
    }
  }
  console.log(`✅ Created ${favCount} favorites`);

  // ── 9. Add reviews ──
  const reviewComments = [
    "Juda ajoyib film, ko'rishni tavsiya etaman!",
    "Yaxshi film, lekin bir oz uzoq.",
    "Zo'r film edi, yana ko'raman!",
    "O'rtacha film, kutganimdek emas edi.",
    "Eng yaxshi filmlardan biri!",
    "Ajoyib aktyor o'yini!",
    "Hayajonli va qiziqarli!",
    "Bolalar bilan birga ko'rdim, hammaga yoqdi.",
    "Klassik film, har doim yoqadi.",
    "Rejissyor zo'r ish qilgan!",
  ];

  let revCount = 0;
  for (let i = 0; i < profiles.length; i++) {
    const movieIdx = i % movies.length;
    await prisma.review.upsert({
      where: { profileId_movieId: { profileId: profiles[i].id, movieId: movies[movieIdx].id } },
      update: {},
      create: {
        profileId: profiles[i].id,
        movieId: movies[movieIdx].id,
        rating: 3 + (i % 3),
        comment: reviewComments[i],
      },
    });
    revCount++;
  }
  console.log(`✅ Created ${revCount} reviews`);

  // ── 10. Add watch history ──
  let whCount = 0;
  for (let i = 0; i < profiles.length; i++) {
    const movieIdx = i % movies.length;
    const movie = movies[movieIdx];
    const watchPercentage = Math.min(60 + i * 4, 100); // capped at 100
    await prisma.watchHistory.upsert({
      where: { profileId_movieId: { profileId: profiles[i].id, movieId: movie.id } },
      update: {},
      create: {
        profileId: profiles[i].id,
        movieId: movie.id,
        watchDuration: Math.floor(movie.duration * 0.7) + i * 5,
        watchPercentage,
        watchStatus: i % 3 === 0 ? 'completed' : 'watching',
      },
    });
    whCount++;
  }
  console.log(`✅ Created ${whCount} watch history entries`);

  // ── 11. Add subscriptions — clear first to avoid duplicates on re-run ──
  await prisma.payment.deleteMany({});
  await prisma.profileSubscription.deleteMany({});

  const subscriptions: ProfileSubscription[] = [];
  for (let i = 0; i < profiles.length; i++) {
    const planIdx = i % plans.length;
    const startDate = new Date();
    const endDate = new Date();

    let status: SubscriptionStatus;
    if (i < 6) {
      status = SubscriptionStatus.ACTIVE;
      endDate.setDate(endDate.getDate() + plans[planIdx].duration_days + 30);
    } else if (i < 8) {
      status = SubscriptionStatus.EXPIRED;
      endDate.setDate(endDate.getDate() - 10);
    } else {
      status = SubscriptionStatus.PENDING_PAYMENT;
      endDate.setDate(endDate.getDate() + plans[planIdx].duration_days);
    }

    subscriptions.push(
      await prisma.profileSubscription.create({
        data: {
          profileId: profiles[i].id,
          subscriptionPlanId: plans[planIdx].id,
          startDate,
          endDate,
          status,
        },
      }),
    );
  }
  console.log(`✅ Created ${subscriptions.length} profile subscriptions`);

  // ── 12. Add payments ──
  let payCount = 0;
  const methods = [PaymentMethod.CARD, PaymentMethod.PAYPAL, PaymentMethod.BANK_TRANSFER];
  for (let i = 0; i < subscriptions.length; i++) {
    let paymentStatus: PaymentStatus;
    if (i < 6) {
      paymentStatus = PaymentStatus.COMPLETED;
    } else if (i < 8) {
      paymentStatus = PaymentStatus.EXPIRED;
    } else {
      paymentStatus = PaymentStatus.PENDING;
    }

    await prisma.payment.create({
      data: {
        profile_id: profiles[i].id,
        profileSubscriptionId: subscriptions[i].id,
        amount: plans[i % plans.length].price,
        status: paymentStatus,
        method: methods[i % methods.length],
      },
    });
    payCount++;
  }
  console.log(`✅ Created ${payCount} payments`);

  // ── 13. Create playlists (safe for re-runs) ──
  await prisma.playlistItem.deleteMany({});
  await prisma.playlist.deleteMany({});

  const playlist1 = await prisma.playlist.create({
    data: { profileId: profiles[0].id, name: 'Sevimli Filmlar' },
  });
  const playlist2 = await prisma.playlist.create({
    data: { profileId: profiles[1].id, name: 'Keyinroq Korish' },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.playlistItem.create({
      data: { playlistId: playlist1.id, movieId: movies[i].id },
    });
    await prisma.playlistItem.create({
      data: { playlistId: playlist2.id, movieId: movies[i + 5].id },
    });
  }
  console.log('✅ Created 2 playlists with items');

  // ── 14. Add reports ──
  const reportReasons = [
    'Noto\'g\'ri kontent',
    'Mualliflik huquqi buzilishi',
    'Spam',
    'Zo\'ravonlik',
    'Boshqa sabab',
  ];

  let reportCount = 0;
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.report.findFirst({
      where: { profileId: profiles[i].id, movieId: movies[i].id },
    });
    if (!existing) {
      await prisma.report.create({
        data: {
          profileId: profiles[i].id,
          movieId: movies[i].id,
          reason: reportReasons[i],
          description: `${reportReasons[i]} sababli bu film haqida shikoyat qilinmoqda.`,
        },
      });
      reportCount++;
    }
  }
  console.log(`✅ Created ${reportCount} reports`);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());