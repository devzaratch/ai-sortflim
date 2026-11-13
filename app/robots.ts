import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ai-sortflim.vercel.app'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/upload', '/watch', '/title/*/watch', '/api'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
