
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
import type { Teacher, DutySchedule, CreateDutyScheduleInput, Floor } from '../../../server/src/schema';

interface DutyScheduleManagementProps {
  teacher: Teacher;
}

export function DutyScheduleManagement({ teacher }: DutyScheduleManagementProps) {
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDutyScheduleInput>({
    teacher_id: teacher.id,
    duty_date: new Date(),
    floor: '2'
  });

  const floors: Floor[] = ['2', '3', '4'];

  const loadSchedules = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getDutySchedulesByTeacher.query({ teacherId: teacher.id });
      setSchedules(result);
    } catch (error) {
      console.error('Failed to load duty schedules:', error);
      setError('Gagal memuat jadwal piket');
    } finally {
      setIsLoading(false);
    }
  }, [teacher.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const newSchedule = await trpc.createDutySchedule.mutate(formData);
      setSchedules((prev: DutySchedule[]) => [...prev, newSchedule]);
      setFormData({
        teacher_id: teacher.id,
        duty_date: new Date(),
        floor: '2'
      });
      setIsAddDialogOpen(false);
      setSuccess('Jadwal piket berhasil ditambahkan');
    } catch (error) {
      console.error('Failed to create duty schedule:', error);
      setError('Gagal menambahkan jadwal piket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    clearMessages();
    try {
      await trpc.deleteDutySchedule.mutate({ id });
      setSchedules((prev: DutySchedule[]) => prev.filter((s: DutySchedule) => s.id !== id));
      setSuccess('Jadwal piket berhasil dihapus');
    } catch (error) {
      console.error('Failed to delete duty schedule:', error);
      setError('Gagal menghapus jadwal piket');
    }
  };

  const getFloorDisplayName = (floor: Floor) => {
    const floorMap: Record<Floor, string> = {
      '2': 'Lantai 2 (Kelas 9A-9F)',
      '3': 'Lantai 3 (Kelas 8A-8F, 9G)',
      '4': 'Lantai 4 (Kelas 7A-7G, 8G)'
    };
    return floorMap[floor];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isScheduleToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSchedulePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < today;
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Tambah Jadwal Piket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Piket Baru</DialogTitle>
              <DialogDescription>
                Tentukan tanggal dan lantai untuk tugas piket Anda
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSchedule}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="duty_date">Tanggal Piket</Label>
                  <Input
                    id="duty_date"
                    type="date"
                    value={formData.duty_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDutyScheduleInput) => ({ 
                        ...prev, 
                        duty_date: new Date(e.target.value)
                      }))
                    }
                    min={getTodayString()}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Lantai Bertugas</Label>
                  <Select
                    value={formData.floor}
                    onValueChange={(value: Floor) =>
                      setFormData((prev: CreateDutyScheduleInput) => ({ ...prev, floor: value }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih lantai" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor} value={floor}>
                          {getFloorDisplayName(floor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Jadwal yang dipilih:</strong><br />
                    {formatDate(formData.duty_date)} - {getFloorDisplayName(formData.floor)}
                  </p>
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

        <div className="text-sm text-gray-600">
          Total: {schedules.length} jadwal piket
        </div>
      </div>

      {/* Schedules Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Tanggal Piket</TableHead>
              <TableHead>Lantai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
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
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada jadwal piket. Tambahkan jadwal pertama dengan tombol di atas.
                </TableCell>
              </TableRow>
            ) : (
              schedules
                .sort((a: DutySchedule, b: DutySchedule) => 
                  new Date(b.duty_date).getTime() - new Date(a.duty_date).getTime()
                )
                .map((schedule: DutySchedule, index: number) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDate(schedule.duty_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.duty_date.toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFloorDisplayName(schedule.floor)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isScheduleToday(schedule.duty_date) ? (
                        <Badge className="bg-green-100 text-green-800">
                          🟢 Hari Ini
                        </Badge>
                      ) : isSchedulePast(schedule.duty_date) ? (
                        <Badge variant="secondary">
                          ⚪ Selesai
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          🔵 Akan Datang
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{schedule.created_at.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {!isSchedulePast(schedule.duty_date) && (
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
                                  Apakah Anda yakin ingin menghapus jadwal piket pada{' '}
                                  <strong>{formatDate(schedule.duty_date)}</strong> di{' '}
                                  <strong>{getFloorDisplayName(schedule.floor)}</strong>?
                                  <br />
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {isSchedulePast(schedule.duty_date) && (
                          <Badge variant="outline" className="text-xs">Selesai</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
