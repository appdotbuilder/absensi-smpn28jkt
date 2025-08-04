
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        try {
          const user = await trpc.validateSession.query({ userId: parseInt(storedUserId) });
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('userId');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('userId');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('userId', user.id.toString());
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('userId');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat aplikasi...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">📚</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Sistem Absensi Siswa
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                SMP Negeri 28 Jakarta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm onLogin={handleLogin} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sistem Absensi Siswa
                </h1>
                <p className="text-sm text-gray-500">SMP Negeri 28 Jakarta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                  {currentUser.role === 'admin' ? 'Administrator' : 'Guru Piket'}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <TeacherDashboard currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 SMP Negeri 28 Jakarta. Sistem Absensi Siswa.</p>
            <p className="mt-1">Dikembangkan untuk memudahkan pengelolaan absensi harian siswa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
