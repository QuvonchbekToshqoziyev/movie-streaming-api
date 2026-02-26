import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const profiles = await prisma.profile.count();
    const users = await prisma.user.count();
    const plans = await prisma.subscriptionPlan.count();
    const cats = await prisma.category.count();
    const movies = await prisma.movies.count();
    const mc = await prisma.movieCategories.count();
    const mf = await prisma.movieFile.count();
    const favs = await prisma.favorite.count();
    const revs = await prisma.review.count();
    const wh = await prisma.watchHistory.count();
    const subs = await prisma.profileSubscription.count();
    const pays = await prisma.payment.count();
    const pls = await prisma.playlist.count();
    const pli = await prisma.playlistItem.count();

    console.log('=== Database Record Counts ===');
    console.log('Profiles:', profiles);
    console.log('Users (admin):', users);
    console.log('Subscription Plans:', plans);
    console.log('Categories:', cats);
    console.log('Movies:', movies);
    console.log('Movie-Category links:', mc);
    console.log('Movie Files:', mf);
    console.log('Favorites:', favs);
    console.log('Reviews:', revs);
    console.log('Watch History:', wh);
    console.log('Profile Subscriptions:', subs);
    console.log('Payments:', pays);
    console.log('Playlists:', pls);
    console.log('Playlist Items:', pli);
}

main().finally(() => prisma.$disconnect());
