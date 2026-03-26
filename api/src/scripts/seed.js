import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";

const usersData = [
  {
    firstName: "Aarav",
    lastName: "Sharma",
    username: "aarav_codes",
    email: "aarav.codes@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
  },
  {
    firstName: "Priya",
    lastName: "Verma",
    username: "priya_reads",
    email: "priya.reads@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"
  },
  {
    firstName: "Kabir",
    lastName: "Mehta",
    username: "kabir_travels",
    email: "kabir.travels@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg"
  },
  {
    firstName: "Neha",
    lastName: "Iyer",
    username: "neha_fitlife",
    email: "neha.fit@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg"
  },
  {
    firstName: "Rohan",
    lastName: "Kapoor",
    username: "rohan_designs",
    email: "rohan.designs@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"
  },
  {
    firstName: "Sara",
    lastName: "Ali",
    username: "sara_foodie",
    email: "sara.foodie@example.com",
    password: "Pass@1234",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg"
  }
];

const postTemplates = [
  {
    text: "Spent the evening building a tiny URL shortener with rate limiting and custom aliases. Learned a lot about edge cases and idempotency.",
    imageUrls: []
  },
  {
    text: "Sunday reading list: distributed systems notes, clean architecture chapter, and a long walk to let ideas settle.",
    imageUrls: ["https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg"]
  },
  {
    text: "Mini travel thread: sunrise at the fort, street chai near the market, and sunset by the lake. Budget trip, huge memories.",
    imageUrls: [
      "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg",
      "https://images.pexels.com/photos/21014/pexels-photo.jpg"
    ]
  },
  {
    text: "Quick home workout challenge: 20 squats, 15 push-ups, 30s plank x 4 rounds. Feels simple, burns real.",
    imageUrls: []
  },
  {
    text: "Shared a fresh dashboard concept with earthy tones and bold typography. Feedback so far: clean, calm, and easy to scan.",
    imageUrls: ["https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg"]
  },
  {
    text: "Tried making ramen at home with roasted garlic oil and miso broth. Not perfect, but definitely repeat-worthy.",
    imageUrls: ["https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg"]
  },
  {
    text: "What is one habit that improved your productivity this month? Mine: planning tomorrow before ending today.",
    imageUrls: []
  },
  {
    text: "Built a small reusable modal component with keyboard accessibility and focus trapping. Tiny detail, big UX gain.",
    imageUrls: []
  }
];

const topLevelCommentTemplates = [
  "This is super helpful, thanks for sharing your process.",
  "Love this perspective. Curious: what would you change next time?",
  "Tried something similar last month, and your approach looks cleaner.",
  "Great post. The practical details make it easy to follow.",
  "This motivated me to start my own version today.",
  "Interesting take. I had a different result when I tested this.",
  "The second point especially stands out. Well explained.",
  "Saved this. Coming back to it on the weekend."
];

const nestedReplyTemplates = [
  "Appreciate it. I can share a step-by-step thread too.",
  "Good question. I would optimize the data flow first.",
  "Same here. Consistency was the hardest part for me.",
  "Thanks. I will post an update after refining it.",
  "That is fair feedback. I will experiment and compare.",
  "Great point. Adding this to my notes.",
  "Agreed. The small details made a big difference.",
  "I tested this again today and got better results."
];

function pickDifferentUser(users, avoidUserId, indexShift = 0) {
  const filtered = users.filter((u) => String(u._id) !== String(avoidUserId));
  return filtered[indexShift % filtered.length];
}

async function clearCollections() {
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
}

async function seedUsers() {
  return await User.insertMany(usersData);
}

async function seedPosts(users) {
  const postsPayload = [];

  // Create two varied posts per user.
  users.forEach((user, userIndex) => {
    const firstTemplate = postTemplates[(userIndex * 2) % postTemplates.length];
    const secondTemplate = postTemplates[(userIndex * 2 + 1) % postTemplates.length];

    postsPayload.push({
      text: `${firstTemplate.text} #${user.username}`,
      imageUrls: firstTemplate.imageUrls,
      userId: user._id,
      likes: [
        pickDifferentUser(users, user._id, 0)._id,
        pickDifferentUser(users, user._id, 1)._id
      ]
    });

    postsPayload.push({
      text: `${secondTemplate.text} #community #socialpost`,
      imageUrls: secondTemplate.imageUrls,
      userId: user._id,
      likes: [pickDifferentUser(users, user._id, 2)._id]
    });
  });

  return await Post.insertMany(postsPayload);
}

async function seedCommentsAndNestedComments(posts, users) {
  let topLevelCount = 0;
  let nestedCount = 0;

  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];

    const commenterOne = pickDifferentUser(users, post.userId, i);
    const commenterTwo = pickDifferentUser(users, post.userId, i + 1);

    const topCommentOne = await Post.create({
      text: topLevelCommentTemplates[i % topLevelCommentTemplates.length],
      imageUrls: [],
      userId: commenterOne._id,
      isComment: true,
      parentPostId: post._id,
      likes: [pickDifferentUser(users, commenterOne._id, i + 2)._id]
    });

    const topCommentTwo = await Post.create({
      text: topLevelCommentTemplates[(i + 3) % topLevelCommentTemplates.length],
      imageUrls: [],
      userId: commenterTwo._id,
      isComment: true,
      parentPostId: post._id,
      likes: []
    });

    post.comments.push(topCommentOne._id, topCommentTwo._id);
    await post.save();
    topLevelCount += 2;

    // Add nested replies under both top-level comments for thread depth.
    const replyOne = await Post.create({
      text: nestedReplyTemplates[i % nestedReplyTemplates.length],
      imageUrls: [],
      userId: pickDifferentUser(users, topCommentOne.userId, i + 4)._id,
      isComment: true,
      parentPostId: topCommentOne._id,
      likes: []
    });

    const replyTwo = await Post.create({
      text: nestedReplyTemplates[(i + 2) % nestedReplyTemplates.length],
      imageUrls: [],
      userId: pickDifferentUser(users, topCommentTwo.userId, i + 5)._id,
      isComment: true,
      parentPostId: topCommentTwo._id,
      likes: []
    });

    topCommentOne.comments.push(replyOne._id);
    topCommentTwo.comments.push(replyTwo._id);

    await Promise.all([topCommentOne.save(), topCommentTwo.save()]);
    nestedCount += 2;
  }

  return { topLevelCount, nestedCount };
}

async function seed() {
  try {
    await connectDB();

    await clearCollections();

    const users = await seedUsers();
    const posts = await seedPosts(users);
    const { topLevelCount, nestedCount } = await seedCommentsAndNestedComments(
      posts,
      users
    );

    console.log("\nSeed completed successfully.");
    console.log(`Users created: ${users.length}`);
    console.log(`Posts created: ${posts.length}`);
    console.log(`Top-level comments created: ${topLevelCount}`);
    console.log(`Nested comments created: ${nestedCount}`);
    console.log(`Total Post documents: ${posts.length + topLevelCount + nestedCount}`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
