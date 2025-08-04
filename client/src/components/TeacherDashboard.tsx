
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DutyScheduleManagement } from '@/components/DutyScheduleManagement';
import { AttendanceManagement } from '@/components/AttendanceManagement';
import { trpc } from '@/utils/trpc';
import type { User, DutySchedule, Teacher } from '../../../server/src/schema';

interface TeacherDashboardProps {
  currentUser: User;
}

export function TeacherDashboard({ currentUser }: TeacherDashboardProps) {
  const [teacherInfo, setTeacherInfo] = useState<Teacher | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<DutySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeacherInfo = useCallback(async () => {
    try {
      // Note: This assumes we can find teacher by user_id or some relation
      // In a real implementation, you'd have a proper way to get teacher info by user
      const teachers = await trpc.getTeachers.query();
      const teacher = teachers.find((t: Teacher) => t.user_id === currentUser.id);
      setTeacherInfo(teacher || null);
      
      if (teacher) {
        const schedules = await trpc.getDutySchedulesByTeacher.query({ teacherId: teacher.id });
        const today = new Date().toDateString();
        const todaySchedules = schedules.filter((s: DutySchedule) => 
          s.duty_date.toDateString() === today
        );
        setTodaySchedules(todaySchedules);
      }
    } catch (error) {
      console.error('Failed to load teacher info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadTeacherInfo();
  }, [loadTeacherInfo]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Guru Piket
        </h1>
        <p className="text-gray-600">
          Selamat datang, {teacherInfo?.name || currentUser.username}! Kelola jadwal piket dan absensi siswa.
        </p>
        {teacherInfo && (
          <p className="text-sm text-gray-500 mt-1">
            NIP: {teacherInfo.nip}
          </p>
        )}
      </div>

      {/* Today's Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Hari Ini</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaySchedules.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaySchedules.length === 0 ? 'Tidak ada tugas piket hari ini' : 'Tugas piket aktif'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lantai Bertugas</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {todaySchedules.length === 0 ? (
                <div className="text-2xl font-bold text-gray-400">-</div>
              ) : (
                todaySchedules.map((schedule: DutySchedule) => (
                  <Badge key={schedule.id} variant="secondary">
                    Lantai {schedule.floor}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Area tanggung jawab piket
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {todaySchedules.length > 0 ? 'Aktif' : 'Standby'}
            </div>
            <p className="text-xs text-muted-foreground">
              Status tugas piket saat ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule" className="flex items-center space-x-2">
            <span>📅</span>
            <span>Jadwal Piket</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center space-x-2">
            <span>📝</span>
            <span>Absensi Siswa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📅</span>
                <span>Kelola Jadwal Piket</span>
              </CardTitle>
              <CardDescription>
                Atur tanggal dan lantai tugas piket Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherInfo ? (
                <DutyScheduleManagement teacher={teacherInfo} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Akun Anda belum terhubung dengan data guru.</p>
                  <p className="text-sm mt-2">Hubungi administrator untuk menghubungkan akun.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📝</span>
                <span>Kelola Absensi Siswa</span>
              </CardTitle>
              <CardDescription>
                Catat kehadiran siswa dan unduh laporan absensi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherInfo ? (
                <AttendanceManagement teacher={teacherInfo} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Akun Anda belum terhubung dengan data guru.</p>
                  <p className="text-sm mt-2">Hubungi administrator untuk menghubungkan akun.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Panduan Tugas Piket</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-900">1. Buat Jadwal Piket</h4>
                <p className="text-gray-600">Tentukan tanggal dan lantai tugas piket Anda</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">2. Catat Absensi</h4>
                <p className="text-gray-600">Tandai kehadiran siswa (Hadir, Sakit, Izin, Alfa, Terlambat)</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">3. Download Laporan</h4>
                <p className="text-gray-600">Unduh laporan absensi dalam format PDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏫</span>
              <span>Struktur Lantai Sekolah</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span><Badge variant="secondary">Lantai 2</Badge></span>
                <span className="text-gray-600">Kelas 9A - 9F</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge variant="secondary">Lantai 3</Badge></span>
                <span className="text-gray-600">Kelas 8A - 8F, 9G</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge variant="secondary">Lantai 4</Badge></span>
                <span className="text-gray-600">Kelas 7A - 7G, 8G</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
