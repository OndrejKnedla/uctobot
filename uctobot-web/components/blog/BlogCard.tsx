"use client";

import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog';
import AIGeneratedImage from './AIGeneratedImage';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
      <Link href={`/blog/${post.slug}`}>
        {post.image ? (
          <div className="relative h-48">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover rounded-t-xl"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <AIGeneratedImage 
            slug={post.slug} 
            alt={post.title}
            title={post.title}
          />
        )}
        
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