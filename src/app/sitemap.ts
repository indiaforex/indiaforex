import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://indiaforex.vercel.app',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://indiaforex.vercel.app/forum',
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: 'https://indiaforex.vercel.app/quant',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]
}
