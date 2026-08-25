import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const demoUsers = [
    { username: "demo1", email: "demo1@example.com", displayName: "Demo One" },
    { username: "demo2", email: "demo2@example.com", displayName: "Demo Two" },
  ];

  const userIds: Record<string, string> = {};

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { usernameLower: u.username.toLowerCase() },
      update: {},
      create: {
        username: u.username,
        usernameLower: u.username.toLowerCase(),
        email: u.email,
        emailLower: u.email.toLowerCase(),
        passwordHash,
        displayName: u.displayName,
      },
    });
    userIds[u.username] = user.id;
    console.log(`User ${u.username} ready (${user.id})`);
  }

  const samplePosts = [
    { author: "demo1", content: "Hello from demo1! This is my first post." },
    { author: "demo1", content: "Enjoying this mini social app." },
    { author: "demo2", content: "Hey everyone, demo2 here." },
    { author: "demo2", content: "Testing out likes and comments." },
    { author: "demo1", content: "Last seeded post - go ahead and interact with it!" },
  ];

  const existingPosts = await prisma.post.count();
  if (existingPosts === 0) {
    for (const p of samplePosts) {
      await prisma.post.create({ data: { content: p.content, authorId: userIds[p.author] } });
    }
    console.log(`Seeded ${samplePosts.length} posts`);
  } else {
    console.log("Posts already exist, skipping post seed");
  }

  console.log("Seed complete. Demo accounts:");
  console.log("  demo1@example.com / demo2@example.com  password: Password123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
