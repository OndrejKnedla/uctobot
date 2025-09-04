import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts, getRelatedPosts } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import BlogCard from '@/components/blog/BlogCard';
import ShareButtons from '@/components/blog/ShareButtons';
import TableOfContents from '@/components/blog/TableOfContents';
import CTABlock from '@/components/blog/CTABlock';
import AIGeneratedImage from '@/components/blog/AIGeneratedImage';
import { HighlightBox, CalculatorBox, StepsList, ComparisonTable } from '@/components/blog/BlogComponents';
import Layout from '@/components/layout/Layout';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Článek nenalezen | DokladBot',
    };
  }

  return {
    title: `${post.title} | DokladBot Blog`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://www.dokladbot.cz/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  const relatedPosts = getRelatedPosts(params.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'DokladBot',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.dokladbot.cz/logo.png',
      },
    },
  };

  return (
    <Layout showMainPageSections={true}>
      <article className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-4 py-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li><Link href="/" className="hover:text-green-600">Domů</Link></li>
          <li>/</li>
          <li><Link href="/blog" className="hover:text-green-600">Blog</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {post.category}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-6 text-gray-600 mb-8">
          <span>{post.author}</span>
          <span>•</span>
          <time>{new Date(post.date).toLocaleDateString('cs-CZ')}</time>
          <span>•</span>
          <span>{post.readingTime} min čtení</span>
        </div>

        <ShareButtons url={`https://www.dokladbot.cz/blog/${post.slug}`} title={post.title} />
      </header>

      {/* Hero Image */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          {post.image ? (
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full">
              <AIGeneratedImage 
                slug={post.slug} 
                alt={post.title}
                title={post.title}
                isHero={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
          <div className="prose prose-lg max-w-none">
            <MDXRemote 
              source={post.content} 
              components={{ 
                HighlightBox, 
                CalculatorBox, 
                StepsList, 
                ComparisonTable 
              }} 
            />
            
            {/* CTA Block */}
            <CTABlock />
          </div>
          
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <TableOfContents content={post.content} />
            </div>
          </aside>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Související články</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
    </Layout>
  );
}