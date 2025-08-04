
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { 
  Teacher, 
  DutySchedule, 
  Student, 
  AttendanceRecord, 
  CreateAttendanceRecordInput,
  UpdateAttendanceRecordInput,
  AttendanceStatus 
} from '../../../server/src/schema';

interface AttendanceManagementProps {
  teacher: Teacher;
}

export function AttendanceManagement({ teacher }: AttendanceManagementProps) {
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<DutySchedule | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getDutySchedulesByTeacher.query({ teacherId: teacher.id });
      // Only show schedules from today and future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const relevantSchedules = result.filter((s: DutySchedule) => {
        const scheduleDate = new Date(s.duty_date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= today;
      });
      setSchedules(relevantSchedules);
    } catch (error) {
      console.error('Failed to load duty schedules:', error);
      setError('Gagal memuat jadwal piket');
    } finally {
      setIsLoading(false);
    }
  }, [teacher.id]);

  const loadStudentsAndAttendance = useCallback(async (schedule: DutySchedule) => {
    try {
      setError(null);
      const [studentsResult, attendanceResult] = await Promise.all([
        trpc.getStudentsByFloor.query({ floor: schedule.floor }),
        trpc.getAttendanceByDutySchedule.query({ dutyScheduleId: schedule.id })
      ]);
      
      setStudents(studentsResult);
      setAttendanceRecords(attendanceResult);
    } catch (error) {
      console.error('Failed to load students and attendance:', error);
      setError('Gagal memuat data siswa dan absensi');
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (selectedSchedule) {
      loadStudentsAndAttendance(selectedSchedule);
    }
  }, [selectedSchedule, loadStudentsAndAttendance]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleScheduleChange = (scheduleId: string) => {
    const schedule = schedules.find((s: DutySchedule) => s.id.toString() === scheduleId);
    setSelectedSchedule(schedule || null);
  };

  const getAttendanceRecord = (studentId: number): AttendanceRecord | null => {
    return attendanceRecords.find((record: AttendanceRecord) => record.student_id === studentId) || null;
  };

  const handleAttendanceChange = async (
    studentId: number, 
    status: AttendanceStatus, 
    isLate: boolean, 
    notes?: string
  ) => {
    if (!selectedSchedule) return;

    setIsSaving(true);
    clearMessages();

    try {
      const existingRecord = getAttendanceRecord(studentId);
      
      if (existingRecord) {
        // Update existing record
        const updateData: UpdateAttendanceRecordInput = {
          id: existingRecord.id,
          status,
          is_late: isLate,
          notes: notes || null
        };
        const updatedRecord = await trpc.updateAttendanceRecord.mutate(updateData);
        setAttendanceRecords((prev: AttendanceRecord[]) =>
          prev.map((record: AttendanceRecord) => 
            record.id === updatedRecord.id ? updatedRecord : record
          )
        );
      } else {
        // Create new record
        const createData: CreateAttendanceRecordInput = {
          duty_schedule_id: selectedSchedule.id,
          student_id: studentId,
          status,
          is_late: isLate,
          notes: notes || null
        };
        const newRecord = await trpc.createAttendanceRecord.mutate(createData);
        setAttendanceRecords((prev: AttendanceRecord[]) => [...prev, newRecord]);
      }
      
      setSuccess('Absensi berhasil disimpan');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      setError('Gagal menyimpan absensi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedSchedule) return;

    try {
      clearMessages();
      await trpc.generateAttendanceReport.mutate({ duty_schedule_id: selectedSchedule.id });
      setSuccess('Laporan PDF akan segera tersedia untuk diunduh');
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Gagal membuat laporan PDF');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFloorDisplayName = (floor: string) => {
    const floorMap: Record<string, string> = {
      '2': 'Lantai 2 (Kelas 9A-9F)',
      '3': 'Lantai 3 (Kelas 8A-8F, 9G)',
      '4': 'Lantai 4 (Kelas 7A-7G, 8G)'
    };
    return floorMap[floor] || `Lantai ${floor}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Jadwal Piket</h3>
        <p className="text-gray-600 mb-4">
          Anda belum memiliki jadwal piket untuk hari ini dan masa mendatang.
        </p>
        <p className="text-sm text-gray-500">
          Silakan buat jadwal piket terlebih dahulu di tab "Jadwal Piket".
        </p>
      </div>
    );
  }

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

      {/* Schedule Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pilih Jadwal Piket</CardTitle>
          <CardDescription>
            Pilih jadwal piket untuk mencatat absensi siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={selectedSchedule?.id.toString() || ''}
                onValueChange={handleScheduleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jadwal piket..." />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule: DutySchedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {formatDate(schedule.duty_date)} - {getFloorDisplayName(schedule.floor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSchedule && (
              <Button onClick={handleDownloadReport} variant="outline">
                📄 Download Laporan PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Form */}
      {selectedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📝</span>
              <span>Absensi Siswa</span>
            </CardTitle>
            <CardDescription>
              {formatDate(selectedSchedule.duty_date)} - {getFloorDisplayName(selectedSchedule.floor)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Tidak ada siswa ditemukan untuk lantai ini.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status Kehadiran</TableHead>
                      <TableHead>Terlambat</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: Student, index: number) => {
                      const attendanceRecord = getAttendanceRecord(student.id);
                      return (
                        <AttendanceRow
                          key={student.id}
                          index={index + 1}
                          student={student}
                          attendanceRecord={attendanceRecord}
                          onSave={(status, isLate, notes) => 
                            handleAttendanceChange(student.id, status, isLate, notes)
                          }
                          isSaving={isSaving}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AttendanceRowProps {
  index: number;
  student: Student;
  attendanceRecord: AttendanceRecord | null;
  onSave: (status: AttendanceStatus, isLate: boolean, notes?: string) => void;
  isSaving: boolean;
}

function AttendanceRow({ index, student, attendanceRecord, onSave, isSaving }: AttendanceRowProps) {
  const [status, setStatus] = useState<AttendanceStatus>(attendanceRecord?.status || 'present');
  const [isLate, setIsLate] = useState(attendanceRecord?.is_late || false);
  const [notes, setNotes] = useState(attendanceRecord?.notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (attendanceRecord) {
      setStatus(attendanceRecord.status);
      setIsLate(attendanceRecord.is_late);
      setNotes(attendanceRecord.notes || '');
    }
    setHasChanges(false);
  }, [attendanceRecord]);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleLateChange = (newIsLate: boolean) => {
    setIsLate(newIsLate);
    setHasChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(status, isLate, notes);
    setHasChanges(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{index}</TableCell>
      <TableCell>{student.name}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {student.class_level}{student.class_section}
        </Badge>
      </TableCell>
      <TableCell>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Hadir</SelectItem>
            <SelectItem value="sick">Sakit</SelectItem>
            <SelectItem value="permission">Izin</SelectItem>
            <SelectItem value="absent">Alfa</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isLate}
            onCheckedChange={handleLateChange}
            disabled={status !== 'present'}
          />
          <span className="text-sm">Terlambat</span>
        </div>
      </TableCell>
      <TableCell>
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Keterangan tambahan..."
          className="min-h-[60px] text-sm"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
