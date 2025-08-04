
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { Teacher, CreateTeacherInput, UpdateTeacherInput } from '../../../server/src/schema';

interface TeacherManagementProps {
  onStatsUpdate: () => void;
}

export function TeacherManagement({ onStatsUpdate }: TeacherManagementProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateTeacherInput>({
    name: '',
    nip: '',
    user_id: null
  });

  const [editFormData, setEditFormData] = useState<UpdateTeacherInput>({
    id: 0,
    name: '',
    nip: '',
    user_id: null
  });

  const loadTeachers = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getTeachers.query();
      setTeachers(result);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setError('Gagal memuat data guru');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const newTeacher = await trpc.createTeacher.mutate(formData);
      setTeachers((prev: Teacher[]) => [...prev, newTeacher]);
      setFormData({
        name: '',
        nip: '',
        user_id: null
      });
      setIsAddDialogOpen(false);
      setSuccess('Guru berhasil ditambahkan');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create teacher:', error);
      setError('Gagal menambahkan guru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditFormData({
      id: teacher.id,
      name: teacher.name,
      nip: teacher.nip,
      user_id: teacher.user_id
    });
    setIsEditDialogOpen(true);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const updatedTeacher = await trpc.updateTeacher.mutate(editFormData);
      setTeachers((prev: Teacher[]) =>
        prev.map((t: Teacher) => t.id === updatedTeacher.id ? updatedTeacher : t)
      );
      setIsEditDialogOpen(false);
      setSuccess('Data guru berhasil diperbarui');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to update teacher:', error);
      setError('Gagal memperbarui data guru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    clearMessages();
    try {
      await trpc.deleteTeacher.mutate({ id });
      setTeachers((prev: Teacher[]) => prev.filter((t: Teacher) => t.id !== id));
      setSuccess('Guru berhasil dihapus');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      setError('Gagal menghapus guru');
    }
  };

  const handleExportTeachers = async () => {
    try {
      clearMessages();
      await trpc.exportTeachers.query();
      // Note: This is a stub implementation - real export would handle Buffer properly
      setSuccess('Fitur ekspor akan segera tersedia');
    } catch (error) {
      console.error('Failed to export teachers:', error);
      setError('Gagal mengekspor data guru');
    }
  };

  const handleImportTeachers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    clearMessages();

    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setError('File CSV kosong atau tidak valid');
        return;
      }

      const teachersToImport: CreateTeacherInput[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const [name, nip] = line.split(',').map(field => field.trim());

        if (!name || !nip) {
          errors.push(`Baris ${lineNumber}: Data tidak lengkap (${line})`);
          return;
        }

        // Basic validation for NIP (should not be empty and reasonable length)
        if (nip.length < 3) {
          errors.push(`Baris ${lineNumber}: NIP terlalu pendek "${nip}"`);
          return;
        }

        teachersToImport.push({
          name: name,
          nip: nip,
          user_id: null // Default to null since we're not handling user linking in CSV import
        });
      });

      if (errors.length > 0) {
        setError(`Terdapat ${errors.length} kesalahan:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        return;
      }

      if (teachersToImport.length === 0) {
        setError('Tidak ada data guru yang valid untuk diimpor');
        return;
      }

      // Call bulk import API
      const importedTeachers = await trpc.bulkImportTeachers.mutate({
        teachers: teachersToImport
      });

      // Update local state
      setTeachers((prev: Teacher[]) => [...prev, ...importedTeachers]);
      setSuccess(`Berhasil mengimpor ${importedTeachers.length} guru dari file CSV`);
      onStatsUpdate();

    } catch (error) {
      console.error('Failed to import teachers:', error);
      setError('Gagal mengimpor data guru. Pastikan format file CSV benar.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
                ➕ Tambah Guru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Guru Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data guru baru untuk ditambahkan ke sistem
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTeacher}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Guru</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTeacherInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Masukkan nama lengkap guru"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP (Nomor Induk Pegawai)</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTeacherInput) => ({ ...prev, nip: e.target.value }))
                      }
                      placeholder="Masukkan NIP guru"
                      required
                      disabled={isSubmitting}
                    />
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

          <Button 
            variant="outline" 
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? '📤 Mengimpor...' : '📤 Impor Excel'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportTeachers}
            style={{ display: 'none' }}
          />

          <Button variant="outline" onClick={handleExportTeachers}>
            📥 Ekspor Excel
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Total: {teachers.length} guru
        </div>
      </div>

      {/* Teachers Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Guru</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Status Akun</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
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
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada data guru. Tambahkan guru pertama dengan tombol di atas.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher: Teacher, index: number) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.nip}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teacher.user_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {teacher.user_id ? '✓ Memiliki Akun' : '○ Belum Ada Akun'}
                    </span>
                  </TableCell>
                  <TableCell>{teacher.created_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(teacher)}
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
                              Apakah Anda yakin ingin menghapus guru <strong>{teacher.name}</strong> (NIP: {teacher.nip})?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeacher(teacher.id)}
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
            <DialogTitle>Edit Data Guru</DialogTitle>
            <DialogDescription>
              Perbarui informasi guru yang sudah ada di sistem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeacher}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nama Guru</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateTeacherInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap guru"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_nip">NIP (Nomor Induk Pegawai)</Label>
                <Input
                  id="edit_nip"
                  value={editFormData.nip || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateTeacherInput) => ({ ...prev, nip: e.target.value }))
                  }
                  placeholder="Masukkan NIP guru"
                  required
                  disabled={isSubmitting}
                />
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
