
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../../../server/src/schema';

interface UserManagementProps {
  onStatsUpdate: () => void;
}

export function UserManagement({ onStatsUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    password: '',
    role: 'teacher'
  });

  const [editFormData, setEditFormData] = useState<UpdateUserInput>({
    id: 0,
    username: '',
    password: '',
    role: 'teacher'
  });

  const userRoles: UserRole[] = ['admin', 'teacher'];

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const newUser = await trpc.createUser.mutate(formData);
      setUsers((prev: User[]) => [...prev, newUser]);
      setFormData({
        username: '',
        password: '',
        role: 'teacher'
      });
      setIsAddDialogOpen(false);
      setSuccess('Pengguna berhasil ditambahkan');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Gagal menambahkan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditFormData({
      id: user.id,
      username: user.username,
      password: '', // Don't pre-fill password for security
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      // Remove empty password from update if not provided
      const updateData = { ...editFormData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const updatedUser = await trpc.updateUser.mutate(updateData);
      setUsers((prev: User[]) =>
        prev.map((u: User) => u.id === updatedUser.id ? updatedUser : u)
      );
      setIsEditDialogOpen(false);
      setSuccess('Data pengguna berhasil diperbarui');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Gagal memperbarui data pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    clearMessages();
    try {
      await trpc.deleteUser.mutate({ id });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== id));
      setSuccess('Pengguna berhasil dihapus');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Gagal menghapus pengguna');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getRoleDisplayName = (role: UserRole) => {
    return role === 'admin' ? 'Administrator' : 'Guru Piket';
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                ➕ Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Buat akun pengguna baru untuk akses ke sistem absensi
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Masukkan username unik"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Masukkan password (min. 6 karakter)"
                      required
                      minLength={6}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Peran Pengguna</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-sm text-gray-600">
          Total: {users.length} pengguna
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada data pengguna. Tambahkan pengguna pertama dengan tombol di atas.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User, index: number) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.created_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{user.updated_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            🗑️ Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus pengguna <strong>{user.username}</strong>?
                              Tindakan ini tidak dapat dibatalkan dan akan menghapus akses login pengguna.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui informasi pengguna yang sudah ada di sistem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_username">Username</Label>
                <Input
                  id="edit_username"
                  value={editFormData.username || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Masukkan username unik"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_password">Password Baru</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={editFormData.password || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  minLength={6}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Kosongkan field ini jika tidak ingin mengubah password
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Peran Pengguna</Label>
                <Select
                  value={editFormData.role || ''}
                  onValueChange={(value: UserRole) =>
                    setEditFormData((prev: UpdateUserInput) => ({ ...prev, role: value }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
