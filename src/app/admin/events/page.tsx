'use client';

import { useState } from 'react';
import { addEvent } from '@/lib/sheetdb';
import { EconomicEvent, ImpactLevel, HistoryItem, StoryItem } from '@/lib/types';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminEvents() {
    const { profile, isLoading } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    // Initial State
    const initialForm: EconomicEvent = {
        time: '',
        date: '',
        currency: 'INR',
        event: '',
        impact: 'Medium',
        actual: '',
        forecast: '',
        previous: '',
        description: '',
        source: '',
        frequency: '',
        nextRelease: '',
        history: [],
        stories: []
    };

    const [form, setForm] = useState<EconomicEvent>(initialForm);

    // Access Check
    if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;

    // Allowed Roles: event_analyst OR super_admin (and technically admin for now if unspecified, but enforcing strict)
    const allowedRoles = ['event_analyst', 'super_admin'];
    if (!profile || !allowedRoles.includes(profile.role)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-4">
                <AlertCircle className="h-16 w-16 text-red-900 mb-4" />
                <h1 className="text-2xl font-bold text-slate-200 mb-2">Access Restricted</h1>
                <p className="mb-6 text-center max-w-md">You do not have permission to access the Events Manager.</p>
                <Link href="/forum"><Button variant="outline">Return to Forum</Button></Link>
            </div>
        );
    }

    // Handlers
    const handleChange = (field: keyof EconomicEvent, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleHistoryChange = (index: number, field: keyof HistoryItem, value: string) => {
        const newHistory = [...(form.history || [])];
        newHistory[index] = { ...newHistory[index], [field]: value };
        setForm(prev => ({ ...prev, history: newHistory }));
    };

    const addHistory = () => {
        setForm(prev => ({ ...prev, history: [...(prev.history || []), { date: '', actual: '', forecast: '', previous: '' }] }));
    };

    const removeHistory = (index: number) => {
        setForm(prev => ({ ...prev, history: prev.history?.filter((_, i) => i !== index) }));
    };

    const handleStoryChange = (index: number, field: keyof StoryItem, value: string) => {
        const newStories = [...(form.stories || [])];
        newStories[index] = { ...newStories[index], [field]: value };
        setForm(prev => ({ ...prev, stories: newStories }));
    };

    const addStory = () => {
        setForm(prev => ({ ...prev, stories: [...(prev.stories || []), { title: '', link: '', time: '', source: '' }] }));
    };

    const removeStory = (index: number) => {
        setForm(prev => ({ ...prev, stories: prev.stories?.filter((_, i) => i !== index) }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Validation: Ensure required fields
            if (!form.date || !form.time || !form.event) {
                toast.error("Please fill in Date, Time and Event Name");
                return;
            }

            // Strict Date Validation (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(form.date)) {
                toast.error("Invalid Date Format. Please use YYYY-MM-DD.");
                return;
            }

            await addEvent(form);
            toast.success('Event added successfully to SheetDB');
            setForm(initialForm); // Reset
        } catch (error) {
            console.error(error);
            toast.error('Failed to add event');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Events Manager</h1>
                        <p className="text-slate-400">Add new economic calendar entries.</p>
                    </div>
                    <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded text-slate-500">
                        Role: {profile.role}
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-slate-900/40 border border-slate-800 p-6 rounded-xl">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-emerald-400 border-b border-slate-800 pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Date (YYYY-MM-DD)</label>
                                <Input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} required className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Time</label>
                                <Input type="time" value={form.time} onChange={e => handleChange('time', e.target.value)} required className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Currency</label>
                                <Select value={form.currency} onValueChange={v => handleChange('currency', v)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-500 mb-1 block">Event Name</label>
                                <Input value={form.event} onChange={e => handleChange('event', e.target.value)} required placeholder="e.g Manufacturing PMI" className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Impact</label>
                                <Select value={form.impact} onValueChange={v => handleChange('impact', v)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['High', 'Medium', 'Low'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Source / Agency</label>
                                <Input value={form.source || ''} onChange={e => handleChange('source', e.target.value)} placeholder="e.g S&P Global" className="bg-slate-950 border-slate-800" />
                            </div>
                        </div>
                    </div>

                    {/* Data Points */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-emerald-400 border-b border-slate-800 pb-2">Data Points</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Actual (Optional)</label>
                                <Input value={form.actual} onChange={e => handleChange('actual', e.target.value)} placeholder="---" className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Forecast</label>
                                <Input value={form.forecast} onChange={e => handleChange('forecast', e.target.value)} placeholder="55.8" className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Previous</label>
                                <Input value={form.previous} onChange={e => handleChange('previous', e.target.value)} placeholder="54.6" className="bg-slate-950 border-slate-800" />
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-emerald-400 border-b border-slate-800 pb-2">Details</h3>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Description</label>
                            <Textarea value={form.description || ''} onChange={e => handleChange('description', e.target.value)} className="bg-slate-950 border-slate-800 h-20" placeholder="What does this event indicate?" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
                                <Input value={form.frequency || ''} onChange={e => handleChange('frequency', e.target.value)} placeholder="e.g Monthly" className="bg-slate-950 border-slate-800" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Next Release</label>
                                <Input value={form.nextRelease || ''} onChange={e => handleChange('nextRelease', e.target.value)} placeholder="e.g Feb 01" className="bg-slate-950 border-slate-800" />
                            </div>
                        </div>
                    </div>

                    {/* History (JSON) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-lg font-medium text-emerald-400">History Data</h3>
                            <Button type="button" onClick={addHistory} size="sm" variant="outline" className="h-7 text-xs border-slate-700 bg-slate-900"><Plus className="h-3 w-3 mr-1" /> Add Entry</Button>
                        </div>
                        {form.history?.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded border border-slate-800">
                                <div className="md:col-span-3">
                                    <Input placeholder="YYYY-MM-DD" value={item.date} onChange={e => handleHistoryChange(idx, 'date', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input placeholder="Actual" value={item.actual} onChange={e => handleHistoryChange(idx, 'actual', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input placeholder="Forecast" value={item.forecast} onChange={e => handleHistoryChange(idx, 'forecast', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input placeholder="Prev" value={item.previous} onChange={e => handleHistoryChange(idx, 'previous', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeHistory(idx)}><X className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        ))}
                        {(!form.history || form.history.length === 0) && <p className="text-xs text-slate-600 italic">No history entries added.</p>}
                    </div>

                    {/* Stories (JSON) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-lg font-medium text-emerald-400">Related Stories</h3>
                            <Button type="button" onClick={addStory} size="sm" variant="outline" className="h-7 text-xs border-slate-700 bg-slate-900"><Plus className="h-3 w-3 mr-1" /> Add Story</Button>
                        </div>
                        {form.stories?.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded border border-slate-800">
                                <div className="md:col-span-4">
                                    <Input placeholder="Headline" value={item.title} onChange={e => handleStoryChange(idx, 'title', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-4">
                                    <Input placeholder="Link URL" value={item.link} onChange={e => handleStoryChange(idx, 'link', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input placeholder="Time/Source" value={item.source} onChange={e => handleStoryChange(idx, 'source', e.target.value)} className="h-8 text-xs bg-slate-900 border-slate-700" />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeStory(idx)}><X className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        ))}
                        {(!form.stories || form.stories.length === 0) && <p className="text-xs text-slate-600 italic">No related stories added.</p>}
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <Button disabled={submitting} type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                            {submitting ? 'Submitting to Sheet...' : 'Add Event to Calendar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
