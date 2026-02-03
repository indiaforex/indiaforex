'use client';

import { useState, useEffect } from 'react';
import { getUsers, toggleUserBan, updateUserRole } from '@/lib/actions/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MoreVertical, Shield, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

type Profile = {
    id: string;
    username: string;
    avatar_url: string | null;
    role: string;
    reputation_points: number;
    is_banned: boolean;
    created_at: string;
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { users, total } = await getUsers(page, 20, debouncedSearch);
            setUsers(users as Profile[]);
            setTotal(total);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleBanToggle = async (user: Profile) => {
        try {
            await toggleUserBan(user.id, user.is_banned);
            toast.success(user.is_banned ? 'User unbanned' : 'User banned');
            fetchUsers(); // Refresh
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRoleChange = async (userId: string, newRole: any) => {
        try {
            await updateUserRole(userId, newRole);
            toast.success(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400">Manage users, roles, and access.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9 bg-slate-900 border-slate-700 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-950">
                        <TableRow className="hover:bg-slate-950 border-slate-800">
                            <TableHead className="text-slate-400">User</TableHead>
                            <TableHead className="text-slate-400">Role</TableHead>
                            <TableHead className="text-slate-400">Reputation</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400">Joined</TableHead>
                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                        <span>Loading users...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-slate-700">
                                                <AvatarImage src={user.avatar_url || ''} />
                                                <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">{user.username}</span>
                                                <span className="text-xs text-slate-500 line-clamp-1">{user.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            user.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    user.role === 'moderator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                        }>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300 font-mono">
                                        {user.reputation_points}
                                    </TableCell>
                                    <TableCell>
                                        {user.is_banned ? (
                                            <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">Banned</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                                                    Set as User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'moderator')}>
                                                    Set as Moderator
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                                    Set as Admin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => handleBanToggle(user)}>
                                                    {user.is_banned ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Unban User
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4" /> Ban User
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Total Users: {total}</span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-slate-900 border-slate-800"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={users.length < 20} // Simple check
                        className="bg-slate-900 border-slate-800"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
