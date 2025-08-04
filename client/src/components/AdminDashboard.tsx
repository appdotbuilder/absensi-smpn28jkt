
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentManagement } from '@/components/StudentManagement';
import { TeacherManagement } from '@/components/TeacherManagement';
import { UserManagement } from '@/components/UserManagement';
import { trpc } from '@/utils/trpc';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const [students, teachers, users] = await Promise.all([
        trpc.getStudents.query(),
        trpc.getTeachers.query(),
        trpc.getUsers.query()
      ]);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalUsers: users.length
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrator
        </h1>
        <p className="text-gray-600">
          Kelola data siswa, guru, dan pengguna sistem absensi SMP Negeri 28 Jakarta
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                stats.totalStudents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Siswa terdaftar di sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <span className="text-2xl">👨‍🏫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                stats.totalTeachers
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Guru terdaftar di sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <span className="text-2xl">🔐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                stats.totalUsers
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Akun pengguna sistem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <span>👥</span>
            <span>Manajemen Siswa</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center space-x-2">
            <span>👨‍🏫</span>
            <span>Manajemen Guru</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <span>🔐</span>
            <span>Manajemen Pengguna</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👥</span>
                <span>Manajemen Data Siswa</span>
              </CardTitle>
              <CardDescription>
                Kelola data siswa, impor/ekspor data Excel, dan atur kelas berdasarkan struktur sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentManagement onStatsUpdate={loadStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👨‍🏫</span>
                <span>Manajemen Data Guru</span>
              </CardTitle>
              <CardDescription>
                Kelola data guru, impor/ekspor data Excel, dan atur informasi NIP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherManagement onStatsUpdate={loadStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔐</span>
                <span>Manajemen Pengguna Sistem</span>
              </CardTitle>
              <CardDescription>
                Kelola akun pengguna, atur peran (Admin/Guru Piket), dan kelola akses sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement onStatsUpdate={loadStats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* School Structure Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏫</span>
            <span>Struktur Kelas Sekolah</span>
          </CardTitle>
          <CardDescription>
            Pembagian kelas berdasarkan lantai di SMP Negeri 28 Jakarta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Lantai 2</Badge>
                <span className="text-sm font-medium">Kelas 9</span>
              </div>
              <div className="space-y-1">
                {['9A', '9B', '9C', '9D', '9E', '9F'].map((kelas) => (
                  <div key={kelas} className="text-sm text-gray-600 pl-4">
                    • {kelas}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Lantai 3</Badge>
                <span className="text-sm font-medium">Kelas 8 & 9G</span>
              </div>
              <div className="space-y-1">
                {['8A', '8B', '8C', '8D', '8E', '8F', '9G'].map((kelas) => (
                  <div key={kelas} className="text-sm text-gray-600 pl-4">
                    • {kelas}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Lantai 4</Badge>
                <span className="text-sm font-medium">Kelas 7 & 8G</span>
              </div>
              <div className="space-y-1">
                {['7A', '7B', '7C', '7D', '7E', '7F', '7G', '8G'].map((kelas) => (
                  <div key={kelas} className="text-sm text-gray-600 pl-4">
                    • {kelas}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
