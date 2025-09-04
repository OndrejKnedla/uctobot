import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import BlogCard from '@/components/blog/BlogCard';
import SearchBar from '@/components/blog/SearchBar';
import NewsletterSection from '@/components/blog/NewsletterSection';
import Layout from '@/components/layout/Layout';

export const metadata: Metadata = {
  title: 'Blog - Poradna pro OSVČ | DokladBot',
  description: 'Užitečné články o účetnictví, daních a podnikání pro OSVČ. Tipy jak ušetřit čas a peníze při vedení účetnictví.',
  openGraph: {
    title: 'Blog - Poradna pro OSVČ | DokladBot',
    description: 'Užitečné články o účetnictví, daních a podnikání pro OSVČ.',
    url: 'https://www.dokladbot.cz/blog',
  },
  other: {
    'rss+xml': '/blog/rss.xml',
  },
};

const categories = [
  { name: 'Všechny', value: 'all' },
  { name: 'Účetnictví', value: 'Účetnictví' },
  { name: 'Daně', value: 'Daně' },
  { name: 'Tipy pro OSVČ', value: 'Tipy pro OSVČ' },
  { name: 'WhatsApp', value: 'WhatsApp' },
];

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <Layout >
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Poradna pro OSVČ
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Praktické rady a tipy pro vaše podnikání. 
              Účetnictví, daně a administrativa jednoduše.
            </p>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category.value}
                className="px-6 py-2 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {/* Newsletter Section */}
          <NewsletterSection className="mt-20" />
        </div>
      </div>
    </Layout>
  );
}