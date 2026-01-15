'use client';

import { useState } from 'react';
import { addEvent } from '@/lib/sheetdb';

export default function Admin() {
    const [form, setForm] = useState({
        time: '',
        event: '',
        impact: 'Medium',
        forecast: '',
        previous: '',
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addEvent({ ...form, actual: '---', impact: form.impact as any });
        alert('Event added');
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add Event</h1>

            <form onSubmit={submit} className="space-y-4">
                <input required placeholder="Time" className="w-full p-3 border" />
                <input required placeholder="Event" className="w-full p-3 border" />
                <button className="bg-blue-600 text-white p-3 rounded w-full">
                    Submit
                </button>
            </form>
        </div>
    );
}
