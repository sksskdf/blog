import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'posts');

function ensurePostsDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

export function getSortedPostsData() {
  ensurePostsDirectory();
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, "");

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the id
    // Convert Date object to string if needed (for JSON serialization)
    const data = { ...matterResult.data };
    if (data.date instanceof Date) {
      data.date = data.date.toISOString().split("T")[0];
    }

    return {
      id,
      ...data,
    };
  });
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getAllPostIds() {
  ensurePostsDirectory();
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    };
  });
}

export async function getPostData(id) {
  ensurePostsDirectory();
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Convert Date object to string if needed (for JSON serialization)
  const data = { ...matterResult.data };
  if (data.date instanceof Date) {
    data.date = data.date.toISOString().split("T")[0];
  }

  return {
    id,
    contentHtml,
    ...data,
  };
}

export function getPostRawData(id) {
  ensurePostsDirectory();
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  return {
    id,
    title: matterResult.data.title || "",
    date: matterResult.data.date || "",
    content: matterResult.content,
  };
}

export function createPost(id, title, date, content) {
  ensurePostsDirectory();
  const fullPath = path.join(postsDirectory, `${id}.md`);

  // 마크다운 파일 형식으로 작성
  const frontMatter = `---
title: ${title}
date: ${date}
---

${content}`;

  fs.writeFileSync(fullPath, frontMatter, "utf8");
}

export function updatePost(id, title, date, content) {
  ensurePostsDirectory();
  const fullPath = path.join(postsDirectory, `${id}.md`);

  // 마크다운 파일 형식으로 작성
  const frontMatter = `---
title: ${title}
date: ${date}
---

${content}`;

  fs.writeFileSync(fullPath, frontMatter, "utf8");
}

export function deletePost(id) {
  ensurePostsDirectory();
  const fullPath = path.join(postsDirectory, `${id}.md`);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}