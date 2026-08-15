import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const videos = [
  {
    id: "sepedi-main",
    title: "Sepedi nursery rhymes",
    titleLocal: "Dikoša tša Sepedi",
    language: "Sepedi",
    theme: "greeting",
    ageRange: "0-2",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Sepedi — curated for caregivers and little ones.",
    videoSrc: "/videos/sepedi/video.mp4",
    driveFileId: "1YZb5_zr8onVP5hzLoVHA1qHR3UcEgrlc",
    thumbA: "#8B4513",
    thumbB: "#E8A87C",
  },
  {
    id: "sesotho-main",
    title: "Sesotho nursery rhymes",
    titleLocal: "Lipina tsa Sesotho",
    language: "Sesotho",
    theme: "lullabies",
    ageRange: "0-2",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Sesotho — curated for caregivers and little ones.",
    videoSrc: "/videos/sesotho/video.mp4",
    driveFileId: "1F_I-Sa5eKvmhuj5H7jWX6tPRv57Qquxl",
    thumbA: "#7c2d12",
    thumbB: "#0b6e63",
  },
  {
    id: "setswana-main",
    title: "Setswana nursery rhymes",
    titleLocal: "Dipina tsa Setswana",
    language: "Setswana",
    theme: "everyday",
    ageRange: "2-4",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Setswana — curated for caregivers and little ones.",
    videoSrc: "/videos/setswana/video.mp4",
    driveFileId: "1PcnRFpwi1cZ9gEzUgvKtigEvwA8WNjEZ",
    thumbA: "#9a3412",
    thumbB: "#e8902a",
  },
];

async function main() {
  for (const video of videos) {
    await prisma.video.upsert({
      where: { id: video.id },
      create: video,
      update: video,
    });
  }
  console.log(`Seeded ${videos.length} videos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
