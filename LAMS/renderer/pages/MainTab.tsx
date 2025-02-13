import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, Wrap, WrapItem, Divider, useTheme,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, useToast, Flex
} from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';

interface Student {
  id: string;
  name: string;
  grade: string;
}

const useSupabaseClient = () => {
  const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
  const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const useAttendanceData = (studentId: string | null) => {
  const [attendanceStats, setAttendanceStats] = useState({
    weekly: { days: 0, hours: 0, attendedDays: [] as number[] },
    monthly: { days: 0, hours: 0 },
    yearly: { days: 0, hours: 0 }
  });

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      const supabase = useSupabaseClient();
      const now = new Date();

      const startDates = {
        week: (() => {
          const date = new Date(now);
          const dayOffset = date.getDay() === 0 ? 6 : date.getDay() - 1;
          date.setDate(date.getDate() - dayOffset);
          date.setHours(0, 0, 0, 0);
          return date;
        })(),
        month: new Date(now.getFullYear(), now.getMonth(), 1),
        year: new Date(now.getFullYear(), 0, 1)
      };

      const periods = ['week', 'month', 'year'] as const;
      const stats = { weekly: {}, monthly: {}, yearly: {} };

      for (const period of periods) {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentId)
          .gte('timestamp', startDates[period].toISOString());

        if (error) {
          console.error(`Error fetching ${period} attendance:`, error);
          continue;
        }

        const attendedDays = new Set(data.map(record => 
          new Date(record.timestamp).toLocaleDateString()
        ));

        let totalHours = 0;
        if (data.length > 1) {
          for (let i = 0; i < data.length - 1; i += 2) {
            if (data[i].status === '出勤' && data[i + 1]?.status === '退勤') {
              const duration = new Date(data[i + 1].timestamp).getTime() - 
                             new Date(data[i].timestamp).getTime();
              totalHours += duration / (1000 * 60 * 60);
            }
          }
        }

        const periodKey = `${period}ly` as keyof typeof stats;
        stats[periodKey] = {
          days: attendedDays.size,
          hours: Math.floor(totalHours),
          ...(period === 'week' && {
            attendedDays: Array.from(new Set(data.map(record => 
              new Date(record.timestamp).getDay()
            )))
          })
        };
      }

      setAttendanceStats(stats as any);
    };

    fetchData();
  }, [studentId]);

  return attendanceStats;
};

const MainTab: React.FC = () => {
  const [students, setStudents] = useState<{ [grade: string]: Student[] }>({
    M2: [], M1: [], B4: [],
  });
  const fontSize = '2xl';
  const theme = useTheme();
  const fontSizePixel = theme.fontSizes[fontSize];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState<{
    [studentId: string]: { status: '出勤' | '退勤'; timestamp: string } | null;
  }>({});
  const [weeklyAttendance, setWeeklyAttendance] = useState<number>(0);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number>(0);
  const [yearlyAttendance, setYearlyAttendance] = useState<number>(0);
  const [weeklyTotalTime, setWeeklyTotalTime] = useState<number>(0);
  const [monthlyTotalTime, setMonthlyTotalTime] = useState<number>(0);
  const [yearlyTotalTime, setYearlyTotalTime] = useState<number>(0);
  const [attendedDays, setAttendedDays] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseClient = useSupabaseClient();

      const { data: studentsData, error } = await supabaseClient
        .from('students')
        .select('*');

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      const groupedStudents: { [grade: string]: Student[] } = { M2: [], M1: [], B4: [] };
      studentsData.forEach((student) => {
        if (!groupedStudents[student.grade]) {
          groupedStudents[student.grade] = [];
        }
        groupedStudents[student.grade].push({
          id: student.id,
          name: student.name,
          grade: student.grade,
        });
      });

      Object.keys(groupedStudents).forEach((grade) => {
        groupedStudents[grade].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      });

      setStudents(groupedStudents);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchInitialAttendance = async () => {
      const supabaseClient = useSupabaseClient();
      const initialStatus: { [studentId: string]: { status: '出勤' | '退勤'; timestamp: string } | null } = {};

      for (const grade in students) {
        for (const student of students[grade]) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { data: attendanceData, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('student_id', student.id)
            .gte('timestamp', today.toISOString())
            .order('timestamp', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching attendance:', error);
            continue;
          }

          if (attendanceData && attendanceData.length > 0) {
            const lastAttendance = attendanceData[0];
            initialStatus[student.id] = {
              status: lastAttendance.status as '出勤' | '退勤',
              timestamp: lastAttendance.timestamp
            };
          } else {
            initialStatus[student.id] = null;
          }
        }
      }
      setAttendanceStatus(initialStatus);
    };
    fetchInitialAttendance();
  }, [students]);

  const fetchAttendanceData = async (studentId: string) => {
    const supabaseClient = useSupabaseClient();

    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: weeklyData, error: weeklyError } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('timestamp', startOfWeek.toISOString());

    if (weeklyError) {
      console.error('Error fetching weekly attendance:', weeklyError);
    } else {
      const weeklyAttendedDays = new Set(weeklyData.map(record => new Date(record.timestamp).toLocaleDateString()));
      const weeklyCount = weeklyAttendedDays.size;
      setWeeklyAttendance(weeklyCount);

      let weeklyTime = 0;
      if (weeklyData && weeklyData.length > 1) {
        for (let i = 0; i < weeklyData.length - 1; i += 2) {
          if (weeklyData[i].status === '出勤' && weeklyData[i + 1] && weeklyData[i + 1].status === '退勤') {
            const checkIn = new Date(weeklyData[i].timestamp).getTime();
            const checkOut = new Date(weeklyData[i + 1].timestamp).getTime();
            weeklyTime += (checkOut - checkIn);
          }
        }
        weeklyTime = weeklyTime / (1000 * 60 * 60);
      } else {
        weeklyTime = 0;
      }
      setWeeklyTotalTime(weeklyTime);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyData, error: monthlyError } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('timestamp', startOfMonth.toISOString());

    if (monthlyError) {
      console.error('Error fetching monthly attendance:', monthlyError);
    } else {
      const monthlyAttendedDays = new Set(monthlyData.map(record => new Date(record.timestamp).toLocaleDateString()));
      const monthlyCount = monthlyAttendedDays.size;
      setMonthlyAttendance(monthlyCount);

      let monthlyTime = 0;
      if (monthlyData && monthlyData.length > 1) {
        for (let i = 0; i < monthlyData.length - 1; i += 2) {
          if (monthlyData[i].status === '出勤' && monthlyData[i + 1] && monthlyData[i + 1].status === '退勤') {
            const checkIn = new Date(monthlyData[i].timestamp).getTime();
            const checkOut = new Date(monthlyData[i + 1].timestamp).getTime();
            monthlyTime += (checkOut - checkIn);
          }
        }
        monthlyTime = monthlyTime / (1000 * 60 * 60);
      } else {
        monthlyTime = 0;
      }
      setMonthlyTotalTime(monthlyTime);
    }

    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    const { data: yearlyData, error: yearlyError } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('timestamp', startOfYear.toISOString());

    if (yearlyError) {
      console.error('Error fetching yearly attendance:', yearlyError);
    } else {
      const yearlyAttendedDays = new Set(yearlyData.map(record => new Date(record.timestamp).toLocaleDateString()));
      const yearlyCount = yearlyAttendedDays.size;

      let yearlyTime = 0;
      if (yearlyData && yearlyData.length > 1) {
        for (let i = 0; i < yearlyData.length - 1; i += 2) {
          if (yearlyData[i].status === '出勤' && yearlyData[i + 1] && yearlyData[i + 1].status === '退勤') {
            const checkIn = new Date(yearlyData[i].timestamp).getTime();
            const checkOut = new Date(yearlyData[i + 1].timestamp).getTime();
            yearlyTime += (checkOut - checkIn);
          }
        }
        yearlyTime = yearlyTime / (1000 * 60 * 60);
      } else {
        yearlyTime = 0;
      }

      setYearlyAttendance(yearlyCount);
      setYearlyTotalTime(yearlyTime);
    }
  };

  const fetchTodayAttendance = async (studentId: string) => {
    const supabase = useSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s attendance:', error);
      return;
    }

    let checkIn = null;
    let checkOut = null;

    // 同じ日のデータのみを処理
    const todayStr = new Date().toLocaleDateString('ja-JP');
    data.forEach(record => {
      const recordDate = new Date(record.timestamp).toLocaleDateString('ja-JP');
      if (recordDate === todayStr) {
        const timestamp = new Date(record.timestamp);
        timestamp.setHours(timestamp.getHours() - 9);
        const localizedTime = timestamp.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (record.status === '出勤' && !checkIn) {
          checkIn = localizedTime;
        }
        if (record.status === '退勤') {
          checkOut = localizedTime;
        }
      }
    });

    setTodayAttendance({ checkIn, checkOut });
  };

  const handleAddStudent = useCallback((grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      const newStudentName = `学生${currentStudents.length + 1}`;
      const newStudentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newStudent: Student = {
        id: newStudentId,
        name: newStudentName,
        grade: grade,
      };
      return {
        ...prevStudents,
        [grade]: [...currentStudents, newStudent],
      };
    });
  }, []);

  const handleRemoveStudent = useCallback((grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      if (currentStudents.length === 0) return prevStudents;
      return {
        ...prevStudents,
        [grade]: currentStudents.slice(0, -1),
      };
    });
  }, []);

  const handleStudentClick = (student: Student) => {
    setSelectedStudentId(student.id);
    setIsModalOpen(true);
    fetchAttendanceData(student.id);
    fetchTodayAttendance(student.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudentId(null);
  };

  const handleAttendance = async (status: '出勤' | '退勤') => {
    if (!selectedStudentId) return;

    if (status === '退勤' && attendanceStatus[selectedStudentId]?.status !== '出勤') {
      toast({
        title: 'Cannot Record 退勤',
        description: `This student is not currently marked as 出勤.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const supabase = useSupabaseClient();
      const now = new Date();
      const timestamp = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      const { error } = await supabase
        .from('attendance')
        .insert([{
          student_id: selectedStudentId,
          status,
          timestamp
        }]);

      if (error) throw error;

      // 当日の日付を取得
      const today = new Date().toLocaleDateString('ja-JP');

      // 新しいattendanceStatusを更新
      setAttendanceStatus(prev => {
        const newStatus = {
          ...prev,
          [selectedStudentId]: { status, timestamp }
        };
        return newStatus;
      });

      // 本日の出勤データを再取得
      fetchTodayAttendance(selectedStudentId);

      toast({
        title: '記録完了',
        description: `${status}を記録しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleCloseModal();
    } catch (error) {
      console.error('Attendance error:', error);
      toast({
        title: '記録失敗',
        description: 'エラーが発生しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const checkAndUpdateAttendance = async () => {
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();

      if (hours === 22 && minutes === 30) {
        const supabaseClient = useSupabaseClient();

        for (const studentId in attendanceStatus) {
          if (attendanceStatus[studentId]?.status === '出勤') {
            await supabaseClient
              .from('attendance')
              .insert([
                {
                  student_id: studentId,
                  status: '退勤',
                  timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) // 修正: 東京ローカル時間を文字列として記録
                },
              ]);

            setAttendanceStatus((prevStatus) => ({
              ...prevStatus,
              [studentId]: { status: '退勤', timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) } // 修正: 東京ローカル時間を文字列として記録
            }));
          }
        }
      }
    };

    const resetAttendanceStatus = () => {
      const currentTime = new Date();
      if (currentTime.getHours() === 0 && currentTime.getMinutes() === 0) {
        setAttendanceStatus({});
      }
    };

    const intervalId = setInterval(() => {
      checkAndUpdateAttendance();
      resetAttendanceStatus();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [attendanceStatus]);

  return (
    <Box textAlign="left" pt={0} height="100%" overflowY="auto" maxHeight="90vh">
      {['M2', 'M1', 'B4'].map((section) => (
        <Box key={section} mb={4}>
          {section === 'M2' && (
            <Text fontSize="2xl" fontWeight="extrabold" mb={3}
              bg="gray.100" borderRadius="md" p={2} textAlign="center">
              {isClient ? `${currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'})}　${currentTime.toLocaleTimeString('ja-JP', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}` : 'Loading...'}
            </Text>
          )}
          <Heading as="h3" size="md" fontSize={fontSize}>
            {section}
          </Heading>
          <Divider my={2} />
          <Wrap maxWidth="none" border={`1px solid ${theme.colors.gray[200]}`} borderRadius="md" p={2} spacing={2}>
            {students[section]?.map((student, index) => (
              <WrapItem key={`${student.id}-${index}`} flexBasis="calc(100% / 5)">
                <Box
                  borderWidth="1px" borderRadius="md" p={2} boxShadow="sm" fontSize="xl"
                  width="100%" minWidth="180px" textAlign="center" margin={0} cursor="pointer"
                  onClick={() => handleStudentClick(student)}
                  borderColor={
                    attendanceStatus[student.id]?.status === '退勤' ? 'red.500' :
                      attendanceStatus[student.id]?.status === '出勤' ? 'blue.500' : 'gray.200'
                  }
                  position="relative"
                >
                  <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                    {student.name}
                  </Text>
                  {attendanceStatus[student.id] && (
                    <Text
                      position="absolute" bottom="0" right="0" fontSize="sm"
                      color={attendanceStatus[student.id]?.status === '退勤' ? 'red.500' : 'blue.500'}
                      padding="0.1rem 0.3rem"
                      fontWeight="bold"
                    >
                      {attendanceStatus[student.id]?.status}
                    </Text>
                  )}
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      ))}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} isCentered>
        <ModalOverlay />
        <ModalContent style={{ width: '30%', aspectRatio: '1 / 1' }}>
          <ModalHeader>
            {students.M2.find(s => s.id === selectedStudentId)?.name ||
              students.M1.find(s => s.id === selectedStudentId)?.name ||
              students.B4.find(s => s.id === selectedStudentId)?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pt={0}>
            <Text p={2} pl={1} fontSize="xs" mb={4}>
              Student ID: {selectedStudentId}
            </Text>
            <Flex justify="space-around" mb={2} fontWeight="bold" fontSize="xl">
                <Box>
                  出勤: {todayAttendance.checkIn || '未出勤'}
                </Box>
                <Box>
                  退勤: {todayAttendance.checkOut || '未退勤'}
                </Box>
              </Flex>
            <Box borderWidth="1px" borderRadius="xl" p={2} boxShadow="sm">
              <Flex justify="space-around" mb={2}>
                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                  <Box
                    key={day} width="30px" height="30px" borderRadius="50%"
                    bg={attendedDays.includes(index) ? 'blue.500' : 'gray.200'}
                    color={attendedDays.includes(index) ? 'white' : 'gray.500'}
                    display="flex" alignItems="center" justifyContent="center" fontSize="sm" m={1}
                  >
                    {day}
                  </Box>
                ))}
              </Flex>
              <Box pl={1}>
                <Text fontSize="sm" mb={1}>
                  今週の出勤: {weeklyAttendance} 日, {isNaN(weeklyTotalTime) ? 0 : (weeklyAttendance > 0 ? Math.floor(weeklyTotalTime) : 0)} 時間
                </Text>
                <Text fontSize="sm" mb={1}>
                  今月の出勤: {monthlyAttendance} 日, {isNaN(monthlyTotalTime) ? 0 : (monthlyAttendance > 0 ? Math.floor(monthlyTotalTime) : 0)} 時間
                </Text>
                <Text fontSize="sm" mb={1}>
                  今年の出勤: {yearlyAttendance} 日, {isNaN(yearlyTotalTime) ? 0 : (yearlyAttendance > 0 ? Math.floor(yearlyTotalTime) : 0)} 時間
                </Text>
              </Box>
            </Box>
          </ModalBody>
          <Flex justify="center" pb={4} width="86%" margin="auto" pt={4}>
            <Button colorScheme="blue" mr={3} onClick={() => {
              handleAttendance('出勤');
            }} width="50%">
              出勤
            </Button>
            <Button colorScheme="red" onClick={() => {
              handleAttendance('退勤');
            }} width="50%">
              退勤
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MainTab;