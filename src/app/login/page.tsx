'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.ok) router.push('/admin');
        else alert('Invalid credentials');
    };

    return (
        <div className="flex h-screen items-center justify-center">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow">
                <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

                <input
                    className="w-full p-3 mb-4 border rounded"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <input
                    className="w-full p-3 mb-6 border rounded"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <button className="w-full bg-blue-600 text-white py-3 rounded">
                    Login
                </button>
            </form>
        </div>
    );
}
