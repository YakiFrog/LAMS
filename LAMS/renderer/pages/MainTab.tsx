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

        const attendedDaysSet = new Set<number>();
        data.forEach(record => {
          // 日本時間での曜日を取得
          const date = new Date(record.timestamp);
          const jpDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
          const dayOfWeek = jpDate.getDay();
          attendedDaysSet.add(dayOfWeek);
        });

        const attendedDays = Array.from(attendedDaysSet);

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
          days: attendedDaysSet.size,
          hours: Math.floor(totalHours),
          ...(period === 'week' && {
            attendedDays: attendedDays
          })
        };
      }

      setAttendanceStats(stats as any);
    };

    fetchData();
  }, [studentId]);

  return attendanceStats;
};

const REFRESH_INTERVAL = {
  ATTENDANCE_STATUS: 3000,  // 出退勤状態: 3秒
  STATISTICS: 10000,        // 統計データ: 10秒
  STUDENT_LIST: 30000      // 学生一覧: 30秒
};

// タイムスタンプを修正する関数を追加
const fixAttendanceTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const jpTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  return jpTime.toISOString();
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });
  const attendanceStats = useAttendanceData(selectedStudentId);
  const { weekly } = attendanceStats;
  const attendedDays = weekly.attendedDays;

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

    // 日本時間で週初めを設定
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

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
    const todayStr = today.toLocaleDateString('ja-JP');
    data.forEach(record => {
      const recordDate = new Date(record.timestamp);
      const recordDateStr = recordDate.toLocaleDateString('ja-JP');
      if (recordDateStr === todayStr) {
        const localTime = new Date(new Date(record.timestamp).getTime() - (9 * 60 * 60 * 1000));
        // タイムスタンプをそのまま使用（既にJST）
        const timeStr = localTime.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });
        if (record.status === '出勤' && !checkIn) {
          checkIn = timeStr;
        }
        if (record.status === '退勤') {
          checkOut = timeStr;
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

    if (status === '出勤' && attendanceStatus[selectedStudentId]?.status === '出勤') {
      toast({
        title: '既に出勤済みです',
        description: '既に出勤として記録されています。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (status === '退勤' && attendanceStatus[selectedStudentId]?.status !== '出勤') {
      toast({
        title: '退勤を記録できません',
        description: `この学生は現在出勤としてマークされていません。`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const supabase = useSupabaseClient();
      
      // 現在時刻を取得し、JSTに調整
      const now = new Date();
      const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const timestamp = jstTime.toISOString();

      const { error } = await supabase
        .from('attendance')
        .insert([{
          student_id: selectedStudentId,
          status,
          timestamp
        }]);

      if (error) throw error;

      setAttendanceStatus(prev => ({
        ...prev,
        [selectedStudentId]: { status, timestamp }
      }));

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
      if (Object.keys(attendanceStatus).length === 0) {
        return;
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();

      // 22:30から24:00の間の場合のみ処理を実行
      if ((currentHour === 22 && currentMinutes >= 30) || currentHour === 23) {
        const supabaseClient = useSupabaseClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let updated = false;

        // 各学生のデータをチェック
        for (const studentId in attendanceStatus) {
          const { data, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .gte('timestamp', today.toISOString())
            .order('timestamp', { ascending: false });

          if (error) {
            console.error('Error fetching attendance:', error);
            continue;
          }

          // その日の最後の記録が出勤で、22:30より前の場合
          if (data && data.length > 0 && 
              data[0].status === '出勤' && 
              new Date(data[0].timestamp) < new Date(today.setHours(22, 30, 0))) {
            try {
              // 退勤時刻を22:30に設定（日本時間）
              const checkoutTime = new Date();
              checkoutTime.setHours(22, 30, 0, 0);
              const jpCheckoutTime = new Date(checkoutTime.getTime() + (9 * 60 * 60 * 1000));
              
              // 退勤処理を実行
              await supabaseClient
                .from('attendance')
                .insert([{
                  student_id: studentId,
                  status: '退勤',
                  timestamp: jpCheckoutTime.toISOString()
                }]);

              // attendanceStatusを更新
              setAttendanceStatus(prev => ({
                ...prev,
                [studentId]: {
                  status: '退勤',
                  timestamp: jpCheckoutTime.toISOString()
                }
              }));

              updated = true;
            } catch (error) {
              console.error('Auto checkout error:', error);
            }
          }
        }

        if (updated) {
          setStudents(prev => ({ ...prev }));
        }
      }
    };

    // 1分ごとにチェック
    const intervalId = setInterval(checkAndUpdateAttendance, 60000);
    
    // 初回実行
    checkAndUpdateAttendance();

    return () => clearInterval(intervalId);
  }, [attendanceStatus, students]);

  // 10秒ごとのデータ更新を実装
  useEffect(() => {
    // 初期データ取得
    const initialFetch = async () => {
      const supabaseClient = useSupabaseClient();

      // 学生データの取得
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

      // 出席状況の取得と更新
      for (const grade in groupedStudents) {
        for (const student of groupedStudents[grade]) {
          const { data: attendanceData, error: attendanceError } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('student_id', student.id)
            .order('timestamp', { ascending: false })
            .limit(1);

          if (attendanceError) {
            console.error('Error fetching attendance:', attendanceError);
            continue;
          }

          if (attendanceData && attendanceData.length > 0) {
            setAttendanceStatus(prev => ({
              ...prev,
              [student.id]: {
                status: attendanceData[0].status as '出勤' | '退勤',
                timestamp: attendanceData[0].timestamp
              }
            }));
          }
        }
      }
    };

    // 初回実行
    initialFetch();

    // 10秒ごとに更新
    const intervalId = setInterval(() => {
      initialFetch();
    }, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, []);

  // 選択された学生の詳細データ更新
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentDetails = async () => {
      await fetchAttendanceData(selectedStudentId);
      await fetchTodayAttendance(selectedStudentId);
    };

    // 初回実行
    fetchStudentDetails();

    // 10秒ごとに更新
    const intervalId = setInterval(() => {
      fetchStudentDetails();
    }, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [selectedStudentId]);

  // 学生一覧と出退勤状態を更新するuseEffect
  useEffect(() => {
    const fetchStudentData = async () => {
      const supabaseClient = useSupabaseClient();

      // 学生データの取得
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

    // 初回データ取得
    fetchStudentData();

    // 定期更新
    const studentListIntervalId = setInterval(() => {
      fetchStudentData();
    }, REFRESH_INTERVAL.STUDENT_LIST);

    // クリーンアップ
    return () => {
      clearInterval(studentListIntervalId);
    };
  }, [students]);

  // 選択された学生の詳細データを更新するuseEffect
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentDetails = async () => {
      await fetchAttendanceData(selectedStudentId);
      await fetchTodayAttendance(selectedStudentId);
    };

    // 初回データ取得
    fetchStudentDetails();

    // 定期更新
    const intervalId = setInterval(() => {
      fetchStudentDetails();
    }, REFRESH_INTERVAL.STATISTICS);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [selectedStudentId]);

  // 起動時に既存データを修正するuseEffect
  useEffect(() => {
    const fixExistingAttendanceData = async () => {
      const supabase = useSupabaseClient();
      
      // 全ての出退勤データを取得
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('*');

      if (error) {
        console.error('Error fetching attendance data:', error);
        return;
      }

      // データの修正
      for (const record of attendanceData) {
        const fixedTimestamp = fixAttendanceTimestamp(record.timestamp);
        if (fixedTimestamp !== record.timestamp) {
          const { error: updateError } = await supabase
            .from('attendance')
            .update({ timestamp: fixedTimestamp })
            .eq('id', record.id);

          if (updateError) {
            console.error('Error updating timestamp:', updateError);
          }
        }
      }
    };

    fixExistingAttendanceData();
  }, []);

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
            <Flex justify="space-around" mb={2} fontSize="xl">
              <Box>
                出勤: <Text as="span" fontSize={todayAttendance.checkIn ? "3xl" : "3xl"} fontWeight="bold">
                {todayAttendance.checkIn || '未出勤'}
                </Text>
              </Box>
              <Box>
                退勤: <Text as="span" fontSize={todayAttendance.checkOut ? "3xl" : "3xl"} fontWeight="bold">
                {todayAttendance.checkOut || '未退勤'}
                </Text>
              </Box>
              </Flex>
            <Box borderWidth="1px" borderRadius="xl" p={2} boxShadow="sm">
              <Flex justify="space-around" mb={2}>
                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                  const dayIndex = (index + 1) % 7;
                  return (
                    <Box
                      key={day} width="30px" height="30px" borderRadius="50%"
                      bg={attendedDays?.includes(dayIndex) ? 'blue.500' : 'gray.200'}
                      color={attendedDays?.includes(dayIndex) ? 'white' : 'gray.500'}
                      display="flex" alignItems="center" justifyContent="center" fontSize="sm" m={1}
                    >
                      {day}
                    </Box>
                  );
                })}
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
            <Button
              colorScheme={attendanceStatus[selectedStudentId]?.status === '出勤' ? 'red' : 'blue'}
              onClick={() => {
                handleAttendance(attendanceStatus[selectedStudentId]?.status === '出勤' ? '退勤' : '出勤');
              }}
              width="100%"
            >
              {attendanceStatus[selectedStudentId]?.status === '出勤' ? '退勤' : '出勤'}
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MainTab;