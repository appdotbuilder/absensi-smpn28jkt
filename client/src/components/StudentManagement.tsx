
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
import type { Student, CreateStudentInput, UpdateStudentInput, ClassLevel, ClassSection } from '../../../server/src/schema';

interface StudentManagementProps {
  onStatsUpdate: () => void;
}

export function StudentManagement({ onStatsUpdate }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStudentInput>({
    name: '',
    class_level: '7',
    class_section: 'A'
  });

  const [editFormData, setEditFormData] = useState<UpdateStudentInput>({
    id: 0,
    name: '',
    class_level: '7',
    class_section: 'A'
  });

  const classLevels: ClassLevel[] = ['7', '8', '9'];
  const classSections: ClassSection[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const loadStudents = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getStudents.query();
      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
      setError('Gagal memuat data siswa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const newStudent = await trpc.createStudent.mutate(formData);
      setStudents((prev: Student[]) => [...prev, newStudent]);
      setFormData({
        name: '',
        class_level: '7',
        class_section: 'A'
      });
      setIsAddDialogOpen(false);
      setSuccess('Siswa berhasil ditambahkan');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create student:', error);
      setError('Gagal menambahkan siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditFormData({
      id: student.id,
      name: student.name,
      class_level: student.class_level,
      class_section: student.class_section
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const updatedStudent = await trpc.updateStudent.mutate(editFormData);
      setStudents((prev: Student[]) =>
        prev.map((s: Student) => s.id === updatedStudent.id ? updatedStudent : s)
      );
      setIsEditDialogOpen(false);
      setSuccess('Data siswa berhasil diperbarui');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to update student:', error);
      setError('Gagal memperbarui data siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    clearMessages();
    try {
      await trpc.deleteStudent.mutate({ id });
      setStudents((prev: Student[]) => prev.filter((s: Student) => s.id !== id));
      setSuccess('Siswa berhasil dihapus');
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to delete student:', error);
      setError('Gagal menghapus siswa');
    }
  };

  const handleExportStudents = async () => {
    try {
      clearMessages();
      await trpc.exportStudents.query();
      // Note: This is a stub implementation - real export would handle Buffer properly
      setSuccess('Fitur ekspor akan segera tersedia');
    } catch (error) {
      console.error('Failed to export students:', error);
      setError('Gagal mengekspor data siswa');
    }
  };

  const getFloorByClass = (classLevel: ClassLevel, classSection: ClassSection): string => {
    const classCode = `${classLevel}${classSection}`;
    
    if (classLevel === '9' && ['A', 'B', 'C', 'D', 'E', 'F'].includes(classSection)) {
      return 'Lantai 2';
    }
    if ((classLevel === '8' && ['A', 'B', 'C', 'D', 'E', 'F'].includes(classSection)) || classCode === '9G') {
      return 'Lantai 3';
    }
    if (classLevel === '7' || classCode === '8G') {
      return 'Lantai 4';
    }
    return 'Tidak diketahui';
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
                ➕ Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data siswa baru untuk ditambahkan ke sistem
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Siswa</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateStudentInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Masukkan nama lengkap siswa"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class_level">Tingkat Kelas</Label>
                      <Select
                        value={formData.class_level}
                        onValueChange={(value: ClassLevel) =>
                          setFormData((prev: CreateStudentInput) => ({ ...prev, class_level: value }))
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tingkat" />
                        </SelectTrigger>
                        <SelectContent>
                          {classLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              Kelas {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class_section">Bagian Kelas</Label>
                      <Select
                        value={formData.class_section}
                        onValueChange={(value: ClassSection) =>
                          setFormData((prev: CreateStudentInput) => ({ ...prev, class_section: value }))
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bagian" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong>Lantai:</strong> {getFloorByClass(formData.class_level, formData.class_section)}
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

          <Button variant="outline" onClick={handleExportStudents}>
            📥 Ekspor Excel
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Total: {students.length} siswa
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Lantai</TableHead>
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
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada data siswa. Tambahkan siswa pertama dengan tombol di atas.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: Student, index: number) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {student.class_level}{student.class_section}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getFloorByClass(student.class_level, student.class_section)}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.created_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(student)}
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
                              Apakah Anda yakin ingin menghapus siswa <strong>{student.name}</strong>?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStudent(student.id)}
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
            <DialogTitle>Edit Data Siswa</DialogTitle>
            <DialogDescription>
              Perbarui informasi siswa yang sudah ada di sistem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStudent}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nama Siswa</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateStudentInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap siswa"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_class_level">Tingkat Kelas</Label>
                  <Select
                    value={editFormData.class_level || ''}
                    onValueChange={(value: ClassLevel) =>
                      setEditFormData((prev: UpdateStudentInput) => ({ ...prev, class_level: value }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      {classLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          Kelas {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_class_section">Bagian Kelas</Label>
                  <Select
                    value={editFormData.class_section || ''}
                    onValueChange={(value: ClassSection) =>
                      setEditFormData((prev: UpdateStudentInput) => ({ ...prev, class_section: value }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bagian" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <strong>Lantai:</strong> {getFloorByClass(
                  (editFormData.class_level || '7') as ClassLevel,
                  (editFormData.class_section || 'A') as ClassSection
                )}
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
