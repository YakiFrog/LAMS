import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Select, FormControl, FormLabel, Grid, GridItem, useTheme, Wrap, WrapItem, Divider, IconButton, Flex } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  timestamp: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
}

const DataTab: React.FC = () => {
  const [students, setStudents] = useState<{ [grade: string]: Student[] }>({
    M2: [],
    M1: [],
    B4: [],
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const theme = useTheme();
  const fontSize = '2xl';
  // ホバーされたデータポイントを追跡するための状態
  const [hoveredData, setHoveredData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
      const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabaseClient
        .from('students')
        .select('*');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      // グレードごとに学生をグループ化
      const groupedStudents: { [grade: string]: Student[] } = { M2: [], M1: [], B4: [] };
      studentsData.forEach((student) => {
        groupedStudents[student.grade]?.push({
          id: student.id,
          name: student.name,
          grade: student.grade,
        });
      });

      // グレードごとに学生を名前でソート
      Object.keys(groupedStudents).forEach((grade) => {
        groupedStudents[grade].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      });

      setStudents(groupedStudents);

      // ローカルストレージから選択された学生IDを取得
      const storedStudentId = localStorage.getItem('selectedStudentId');

      if (storedStudentId) {
        setSelectedStudentId(storedStudentId);
      } else {
        // 年間の出勤時間が最も長い学生を初期選択する関数
        const selectStudentWithMostWorkTime = async (students: { [grade: string]: Student[] }) => {
          let maxWorkTime = 0;
          let studentIdWithMaxWorkTime = '';

          for (const grade in students) {
            for (const student of students[grade]) {
              // 出勤データを取得
              const { data: attendanceData, error: attendanceError } = await supabaseClient
                .from('attendance')
                .select('*')
                .eq('student_id', student.id)
                .order('timestamp', { ascending: true });

              if (attendanceError) {
                console.error('Error fetching attendance data:', attendanceError);
                continue;
              }

              // 年間の出勤時間を計算
              const yearlyData = processAttendanceData(attendanceData || [], 'yearly');
              const totalWorkTime = yearlyData.reduce((sum, item) => sum + item.出勤時間, 0);

              if (totalWorkTime > maxWorkTime) {
                maxWorkTime = totalWorkTime;
                studentIdWithMaxWorkTime = student.id;
              }
            }
          }
          return studentIdWithMaxWorkTime;
        };

        // 年間の出勤時間が最も長い学生を選択
        const initialStudentId = await selectStudentWithMostWorkTime(groupedStudents);
        setSelectedStudentId(initialStudentId);
      }
    };

    // 初回データ取得
    fetchData();

    // 10秒ごとにデータを更新
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    // クリーンアップ関数
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedStudentId) {
        setAttendanceData([]);
        setWeeklyData([]);
        setMonthlyData([]);
        setYearlyData([]);
        return;
      }

      const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
      const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // Fetch attendance data for the selected student
      const { data: attendanceData, error: attendanceError } = await supabaseClient
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('timestamp', { ascending: true });

      if (attendanceError) {
        console.error('Error fetching attendance data:', attendanceError);
        return;
      }

      setAttendanceData(attendanceData || []);
    };

    // 初回データ取得
    fetchAttendanceData();

    // 10秒ごとにデータを更新
    const intervalId = setInterval(() => {
      fetchAttendanceData();
    }, 10000);

    // クリーンアップ関数
    return () => clearInterval(intervalId);
  }, [selectedStudentId]);

  useEffect(() => {
    // selectedStudentIdが変更されたらローカルストレージに保存
    localStorage.setItem('selectedStudentId', selectedStudentId);
  }, [selectedStudentId]);

  // 勤務時間を集計する共通関数
  const processAttendanceData = (
    attendanceData: AttendanceRecord[],
    timeFrame: 'weekly' | 'monthly' | 'yearly'
  ): any[] => {
    const timeData: { [key: string]: { checkIn: Date | null, workTime: { [key: number]: number } } } = {};
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

    attendanceData.forEach((record) => {
      const date = new Date(record.timestamp);
      let timeKey: string = '';
      let timeValue: number = 0;

      if (timeFrame === 'weekly') {
        timeKey = `${date.getFullYear()}-W${getWeek(date)}`;
        timeValue = (date.getDay() + 6) % 7;
      } else if (timeFrame === 'monthly') {
        timeKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        timeValue = date.getDate();
      } else if (timeFrame === 'yearly') {
        timeKey = `${date.getFullYear()}`;
        timeValue = date.getMonth() + 1;
      }

      if (!timeData[timeKey]) {
        timeData[timeKey] = { checkIn: null, workTime: {} };
        if (timeFrame === 'weekly') {
          dayNames.forEach((_, i) => (timeData[timeKey].workTime[i] = 0));
        } else if (timeFrame === 'monthly') {
          for (let i = 1; i <= 31; i++) {
            timeData[timeKey].workTime[i] = 0;
          }
        } else if (timeFrame === 'yearly') {
          for (let i = 1; i <= 12; i++) {
            timeData[timeKey].workTime[i] = 0;
          }
        }
      }

      if (record.status === '出勤') {
        timeData[timeKey].checkIn = date;
      } else if (record.status === '退勤' && timeData[timeKey].checkIn) {
        const timeDiff = date.getTime() - timeData[timeKey].checkIn!.getTime();
        timeData[timeKey].workTime[timeValue] += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
        timeData[timeKey].checkIn = null;
      }
    });

    return Object.entries(timeData).flatMap(([timeKey, data]) => {
      const workTime = data.workTime;
      if (timeFrame === 'weekly') {
        return Object.entries(workTime).map(([dayIndex, 出勤時間]) => ({
          day: dayNames[Number(dayIndex)],
          出勤時間: Number(出勤時間),
        }));
      } else {
        return Object.entries(workTime).map(([timeValue, 出勤時間]) => ({
          day: timeValue,
          month: timeValue,
          出勤時間: Number(出勤時間),
        }));
      }
    });
  };

  useEffect(() => {
    if (attendanceData.length > 0) {
      setWeeklyData(processAttendanceData(attendanceData, 'weekly'));
      setMonthlyData(processAttendanceData(attendanceData, 'monthly'));
      setYearlyData(processAttendanceData(attendanceData, 'yearly'));
    } else {
      setWeeklyData([]);
      setMonthlyData([]);
      setYearlyData([]);
    }
  }, [attendanceData]);

  // Function to get the week number
  const getWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    let dayNum = d.getUTCDay(); // 0 (日) から 6 (土)
    dayNum = (dayNum + 6) % 7; // 月曜日を0とする (0: 月, 1: 火, ..., 6: 日)
    d.setUTCDate(d.getUTCDate() + 3 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const handleAddStudent = (grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      const newStudentName = `学生${currentStudents.length + 1}`;
      // 新しい学生のIDを生成するロジックが必要です (例: UUIDの生成)
      const newStudentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // これはあくまで例です
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
  };

  const handleRemoveStudent = (grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      if (currentStudents.length === 0) return prevStudents;
      return {
        ...prevStudents,
        [grade]: currentStudents.slice(0, -1),
      };
    });
  };

  const renderChart = (data: any[], dataKey: string, chartType: 'weekly' | 'monthly' | 'yearly', height: number, xAxisDataKey: string) => {
    // 合計出勤時間を計算
    const totalWorkTime = data.reduce((sum, item) => sum + item[dataKey], 0);

    // 単位を適切に変換
    let displayTime: string;
    if (totalWorkTime >= 1) {
      displayTime = `${totalWorkTime.toFixed(2)} 時間`;
    } else if (totalWorkTime * 60 >= 1) {
      displayTime = `${(totalWorkTime * 60).toFixed(2)} 分`;
    } else {
      displayTime = `${(totalWorkTime * 60 * 60).toFixed(2)} 秒`;
    }

    return (
      <Box>
        <Heading as="h3" size="md" mb={3} pl={0}>
          {chartType === 'weekly' ? '週ごとの出勤時間' : chartType === 'monthly' ? '月ごとの出勤時間' : '年ごとの出勤時間'}
          <Text fontSize="sm" fontWeight="bold" ml={2} display="inline">
            (合計: {displayTime})
          </Text>
        </Heading>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data.length > 0 ? data : []}
            margin={{ top: 0, right: 10, left: 0, bottom: 5 }}
            onMouseMove={(event) => {
              if (event && event.activePayload && event.activePayload[0]) {
                setHoveredData({ type: chartType, data: event.activePayload[0].payload });
              } else {
                setHoveredData(null);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis tickFormatter={(value: number) => {
              if (value >= 1) {
                return `${value.toFixed(0)} 時間`;
              } else if (value * 60 >= 1) {
                return `${(value * 60).toFixed(0)} 分`;
              } else {
                return `${(value * 60 * 60).toFixed(0)} 秒`;
              }
            }} />
            <Tooltip content={<CustomTooltip payload={hoveredData?.type === chartType ? [hoveredData.data] : []} />} />
            <Bar dataKey={dataKey} fill="#28a745" barSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box textAlign="left" p={0} height="100%">
      <Grid templateColumns="3fr 2.56fr" gap={5} height="100%">
        <GridItem height="100%">
          <Flex direction="column" height="100%">
            {selectedStudentId && (
              <Box>
                {renderChart(weeklyData, '出勤時間', 'weekly', 250, 'day')}
                {renderChart(monthlyData, '出勤時間', 'monthly', 150, 'day')}
                {renderChart(yearlyData, '出勤時間', 'yearly', 150, 'month')}
              </Box>
            )}
          </Flex>
        </GridItem>

        <GridItem height="100%">
          <Box
            bg="white"
            zIndex={1}
            overflowY="auto"
            maxHeight="80vh" // 画面の高さに合わせて調整
          >
            {['M2', 'M1', 'B4'].map((section) => (
              <Box key={section} mb={4}>
                <Heading as="h3" size="md" fontSize={fontSize}>
                  {section}
                </Heading>
                <Divider my={2} />
                <Wrap maxWidth="none" border={`1px solid ${theme.colors.gray[200]}`} borderRadius="md" p={2} spacing={2}>
                  {students[section]?.map((student, index) => (
                    <WrapItem key={`${student.id}-${index}`} flexBasis="calc(100% / 10
                    )">
                      <Box
                        borderWidth="1px"
                        borderRadius="md"
                        p={1}
                        pl={2}
                        pr={2}
                        boxShadow="sm"
                        fontSize="md"
                        width="100%"
                        textAlign="center"
                        margin={0}
                        borderColor={selectedStudentId === student.id ? 'blue.500' : 'gray.200'}
                        position="relative"
                        cursor="pointer"
                        onClick={() => setSelectedStudentId(student.id)}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {student.name}
                      </Box>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            ))}
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

// カスタムTooltipコンポーネント
const CustomTooltip: React.FC<{ payload: any[] }> = ({ payload }) => {
  if (payload && payload.length > 0) {
    const data = payload[0].payload;
    let labelKey = Object.keys(data).find(key => key === 'day' || key === 'month');
    let labelPrefix = labelKey === 'day' ? '日' : '月';
    let label = `${labelPrefix}: ${data[labelKey! as keyof typeof data]}`;
    let value = '';
    const hours = data.出勤時間;

    if (hours >= 1) {
      value = `出勤時間: ${hours.toFixed(0)} 時間`;
    } else if (hours * 60 >= 1) {
      value = `出勤時間: ${(hours * 60).toFixed(0)} 分`;
    } else {
      value = `出勤時間: ${(hours * 60 * 60).toFixed(0)} 秒`;
    }

    return (
      <Box bg="white" border="1px solid #ccc" p={2}>
        <Text>{label}</Text>
        <Text>{value}</Text>
      </Box>
    );
  }

  return null;
};

export default DataTab;