import { Metadata } from "next";
import { Settings } from "../types";

/**
 * 사이트의 기본 URL을 가져옵니다.
 * 환경변수 NEXT_PUBLIC_SITE_URL이 설정되어 있으면 사용하고,
 * 없으면 기본값 https://blog-harry.vercel.app을 사용합니다.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog-harry.vercel.app"
  );
}

/**
 * 포스트 내용에서 설명(description)을 추출합니다.
 * HTML 태그를 제거하고, 처음 160자 정도를 반환합니다.
 */
export function extractDescriptionFromContent(
  content: string,
  maxLength: number = 160
): string {
  // HTML 태그 제거
  const textContent = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (textContent.length <= maxLength) {
    return textContent;
  }

  // 문장 단위로 자르기
  const truncated = textContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * 기본 메타데이터를 생성합니다.
 */
export function generateBaseMetadata(settings: Settings): Metadata {
  const siteUrl = getSiteUrl();
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";
  const description =
    settings.description ||
    `${settings.name || "Harry-"}의 블로그입니다. ${settings.subtitle || "Programmer"}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description,
    keywords: [
      "블로그",
      "개발",
      "프로그래밍",
      "기술",
      "코딩",
      "개발자",
      "programming",
      "development",
      "tech",
      "blog",
    ],
    authors: [{ name: settings.name || "Harry-" }],
    creator: settings.name || "Harry-",
    publisher: settings.name || "Harry-",
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: siteUrl,
      siteName: siteTitle,
      title: siteTitle,
      description,
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [`${siteUrl}/og-image.png`],
    },
    alternates: {
      canonical: siteUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * 포스트용 메타데이터를 생성합니다.
 */
export function generatePostMetadata(
  post: {
    id: string;
    title: string;
    date: string;
    category: string | null;
    content?: string;
  },
  settings: Settings
): Metadata {
  const siteUrl = getSiteUrl();
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";
  const postUrl = `${siteUrl}/posts/${post.id}`;
  
  // 포스트 설명 추출
  const description = post.content
    ? extractDescriptionFromContent(post.content)
    : `${post.title} - ${siteTitle}`;

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      locale: "ko_KR",
      url: postUrl,
      siteName: siteTitle,
      title: post.title,
      description,
      publishedTime: post.date,
      authors: [settings.name || "Harry-"],
      tags: post.category ? [post.category] : undefined,
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [`${siteUrl}/og-image.png`],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

/**
 * 웹사이트 구조화된 데이터 (JSON-LD)를 생성합니다.
 */
export function generateWebsiteStructuredData(settings: Settings): object {
  const siteUrl = getSiteUrl();
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: siteTitle,
    description:
      settings.description ||
      `${settings.name || "Harry-"}의 블로그입니다. ${settings.subtitle || "Programmer"}`,
    url: siteUrl,
    author: {
      "@type": "Person",
      name: settings.name || "Harry-",
    },
    publisher: {
      "@type": "Person",
      name: settings.name || "Harry-",
    },
    inLanguage: "ko-KR",
  };
}

/**
 * 포스트 구조화된 데이터 (JSON-LD)를 생성합니다.
 */
export function generatePostStructuredData(
  post: {
    id: string;
    title: string;
    date: string;
    category: string | null;
    content?: string;
  },
  settings: Settings
): object {
  const siteUrl = getSiteUrl();
  const siteTitle = settings.siteTitle || "HARRY'S BLOG";
  const postUrl = `${siteUrl}/posts/${post.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.content
      ? extractDescriptionFromContent(post.content, 200)
      : post.title,
    image: `${siteUrl}/og-image.png`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: settings.name || "Harry-",
    },
    publisher: {
      "@type": "Person",
      name: settings.name || "Harry-",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    articleSection: post.category || undefined,
    inLanguage: "ko-KR",
  };
}

