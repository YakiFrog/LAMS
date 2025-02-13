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
  const fontSize = '2xl'; // 文字サイズを調整するための変数（文字サイズは 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl' のいずれか）
  const fontSizePixel = theme.fontSizes[fontSize]; // fontSizeに対応するピクセル値を取得

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
        if (!groupedStudents[student.grade]) {
          groupedStudents[student.grade] = [];
        }
        groupedStudents[student.grade].push({
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
      // 最初の学生を選択
      // if (studentsData && studentsData.length > 0) {
      //   setSelectedStudentId(studentsData[0].id);
      // }
    };

    fetchData();
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

    fetchAttendanceData();
  }, [selectedStudentId, students]);

  useEffect(() => {
    // Process weekly data
    const processWeeklyData = () => {
      const weekly: { [week: string]: { [day: string]: number } } = {};
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const week = `${date.getFullYear()}-W${getWeek(date)}`;
        const day = dayNames[date.getDay()];

        if (!weekly[week]) {
          weekly[week] = {};
        }

        if (!weekly[week][day]) {
          weekly[week][day] = 0;
        }
      });

      const weeklyArray = Object.entries(weekly).flatMap(([week, weekData]) => {
        let lastCheckInTime: Date | null = null;
        const dayWorkTime: { [day: string]: number } = {};
        dayNames.forEach(day => dayWorkTime[day] = 0);

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordWeek = `${recordDate.getFullYear()}-W${getWeek(recordDate)}`;
          const recordDay = dayNames[recordDate.getDay()];

          if (week === recordWeek) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              dayWorkTime[recordDay] += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return Object.entries(dayWorkTime).map(([day, 出勤時間]) => ({ day, 出勤時間 }));
      });

      setWeeklyData(weeklyArray);
    };

    // Process monthly data
    const processMonthlyData = () => {
      const monthly: { [month: string]: { [day: number]: number } } = {};

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const day = date.getDate();

        if (!monthly[month]) {
          monthly[month] = {};
        }

        if (!monthly[month][day]) {
          monthly[month][day] = 0;
        }
      });

      const monthlyArray = Object.entries(monthly).flatMap(([month, monthData]) => {
        let lastCheckInTime: Date | null = null;
        const dayWorkTime: { [day: number]: number } = {};
        for (let i = 1; i <= 31; i++) {
          dayWorkTime[i] = 0;
        }

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordMonth = `${recordDate.getFullYear()}-${recordDate.getMonth() + 1}`;
          const recordDay = recordDate.getDate();

          if (month === recordMonth) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              dayWorkTime[recordDay] += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return Object.entries(dayWorkTime).map(([day, 出勤時間]) => ({ day, 出勤時間: Number(出勤時間) }));
      });

      setMonthlyData(monthlyArray);
    };

    // Process yearly data
    const processYearlyData = () => {
      const yearly: { [year: string]: { [month: number]: number } } = {};

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const year = `${date.getFullYear()}`;
        const month = date.getMonth() + 1;

        if (!yearly[year]) {
          yearly[year] = {};
        }

        if (!yearly[year][month]) {
          yearly[year][month] = 0;
        }
      });

      const yearlyArray = Object.entries(yearly).flatMap(([year, yearData]) => {
        let lastCheckInTime: Date | null = null;
        const monthWorkTime: { [month: number]: number } = {};
        for (let i = 1; i <= 12; i++) {
          monthWorkTime[i] = 0;
        }

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordYear = `${recordDate.getFullYear()}`;
          const recordMonth = recordDate.getMonth() + 1;

          if (year === recordYear) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              monthWorkTime[recordMonth] += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return Object.entries(monthWorkTime).map(([month, 出勤時間]) => ({ month, 出勤時間: Number(出勤時間) }));
      });

      setYearlyData(yearlyArray);
    };

    if (attendanceData.length > 0) {
      processWeeklyData();
      processMonthlyData();
      processYearlyData();
    } else {
      setWeeklyData([]);
      setMonthlyData([]);
      setYearlyData([]);
    }
  }, [attendanceData]);

  // Function to get the week number
  const getWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
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

  return (
    <Box textAlign="left" p={0} height="100%">
      <Grid templateColumns="3fr 2.56fr" gap={5} height="100%">
        <GridItem height="100%">
          <Flex direction="column" height="100%">
            {selectedStudentId && (
              <Box>
                <Heading as="h3" size="md" mb={4}>
                  週ごとの出勤時間
                </Heading>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData.length > 0 ? weeklyData : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${(value * 60).toFixed(0)} 分`;
                      } else {
                        return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                    }} />
                    <Tooltip formatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${value.toFixed(2)} 分`;
                      } else {
                        return `${value * 60 * 60} 秒`;
                      }
                    }} />
                    {/* <Legend /> */}
                    <Bar dataKey="出勤時間" fill="#28a745" barSize={15} />
                  </BarChart>
                </ResponsiveContainer>

                <Heading as="h3" size="md" mb={4}>
                  月ごとの出勤時間
                </Heading>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={monthlyData.length > 0 ? monthlyData : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${(value * 60).toFixed(0)} 分`;
                      } else {
                        return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                    }} />
                    <Tooltip formatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${value.toFixed(2)} 分`;
                      } else {
                        return `${value * 60 * 60} 秒`;
                      }
                    }} />
                    {/* <Legend /> */}
                    <Bar dataKey="出勤時間" fill="#28a745" barSize={15} />
                  </BarChart>
                </ResponsiveContainer>

                <Heading as="h3" size="md" mb={4}>
                  年ごとの出勤時間
                </Heading>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={yearlyData.length > 0 ? yearlyData : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${(value * 60).toFixed(0)} 分`;
                      } else {
                        return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                    }} />
                    <Tooltip formatter={(value: number) => {
                      if (value >= 1) {
                        return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                        return `${value.toFixed(2)} 分`;
                      } else {
                        return `${value * 60 * 60} 秒`;
                      }
                    }} />
                    {/* <Legend /> */}
                    <Bar dataKey="出勤時間" fill="#28a745" barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
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
                        fontSize="lg"
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

export default DataTab;