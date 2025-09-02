'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              {post.category}
            </span>
            <span>{post.readingTime} min čtení</span>
          </div>
          
          <h2 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
            {post.title}
          </h2>
          
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{new Date(post.date).toLocaleDateString('cs-CZ')}</span>
            <span className="text-green-600 font-semibold hover:text-green-700">
              Číst dále →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}