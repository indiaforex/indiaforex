import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>
        const title = searchParams.get('title')?.slice(0, 100) || 'India Forex Board';
        const author = searchParams.get('author') || 'Anonymous';
        const replies = searchParams.get('replies') || '0';
        const likes = searchParams.get('likes') || '0';

        // Base URL for fetching the logo - ensure this matches your deployment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const logoUrl = `${baseUrl}/workmark.png`;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#020617', // slate-950
                        backgroundImage: 'linear-gradient(to bottom right, #020617, #0f172a)',
                        padding: '40px 80px',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Logo / Brand - Wordmark */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                        {/* Wordmark Logo */}
                        <img
                            src={logoUrl}
                            height="60"
                            style={{ objectFit: 'contain', height: '60px' }}
                        />
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: 60, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '20px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {title}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1e293b', border: '2px solid #334155', marginRight: '15px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                {author.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 24, color: '#f8fafc', fontWeight: 'bold' }}>{author}</span>
                                <span style={{ fontSize: 18, color: '#64748b' }}>Author</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: 32, color: '#10b981', fontWeight: 'bold' }}>{likes}</span>
                                <span style={{ fontSize: 16, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Likes</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: 32, color: '#3b82f6', fontWeight: 'bold' }}>{replies}</span>
                                <span style={{ fontSize: 16, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Replies</span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', transform: 'rotate(-45deg)', opacity: 0.6 }} />
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
