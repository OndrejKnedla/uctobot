import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  date: string;
  author: string;
  category: string;
  readingTime: number;
  content: string;
  excerpt: string;
  image?: string;
  tags?: string[];
}

const postsDirectory = path.join(process.cwd(), 'content/blog');

export function getPostSlugs() {
  try {
    return fs.readdirSync(postsDirectory);
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const realSlug = slug.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, `${realSlug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Calculate reading time (average 200 words per minute)
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);

    return {
      slug: realSlug,
      title: data.title || '',
      metaDescription: data.metaDescription || '',
      date: data.date || new Date().toISOString(),
      author: data.author || 'Tým DokladBot',
      category: data.category || 'Účetnictví',
      readingTime,
      content,
      excerpt: data.excerpt || content.slice(0, 150) + '...',
      image: data.image,
      tags: data.tags || [],
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(post => post.category === category);
}

export function getRelatedPosts(slug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];
  
  return getAllPosts()
    .filter(post => post.slug !== slug && post.category === currentPost.category)
    .slice(0, limit);
}