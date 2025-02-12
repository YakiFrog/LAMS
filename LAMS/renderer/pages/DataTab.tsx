import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Select, FormControl, FormLabel, Grid, GridItem } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  timestamp: string;
}

const DataTab: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);

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

      setStudents(studentsData || []);
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
  }, [selectedStudentId]);

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

  return (
    <Box textAlign="left" p={4}>
      {/* <Heading as="h2" size="lg" mb={4}>
        データタブ
      </Heading> */}
      <FormControl mb={4}>
        <FormLabel>学生を選択:</FormLabel>
        <Select
          placeholder="学生を選択"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {selectedStudentId && (
        <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={10}>
          <GridItem>
            <Heading as="h3" size="md" mt={4}>
              週ごとの出勤時間
            </Heading>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
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
                      return `${(value * 60).toFixed(2)} 分`;
                    } else {
                      return `${(value * 60 * 60).toFixed(2)} 秒`;
                    }
                  }} />
                  <Legend />
                  <Bar dataKey="出勤時間" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text>No weekly data available.</Text>
            )}
          </GridItem>

          <GridItem>
            <Heading as="h3" size="md" mt={4}>
              月ごとの出勤時間
            </Heading>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
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
                      return `${(value * 60).toFixed(2)} 分`;
                    } else {
                      return `${(value * 60 * 60).toFixed(2)} 秒`;
                    }
                  }} />
                  <Legend />
                  <Bar dataKey="出勤時間" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text>No monthly data available.</Text>
            )}
          </GridItem>

          <GridItem>
            <Heading as="h3" size="md" mt={4}>
              年ごとの出勤時間
            </Heading>
            {yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
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
                      return `${(value * 60).toFixed(2)} 分`;
                    } else {
                      return `${(value * 60 * 60).toFixed(2)} 秒`;
                    }
                  }} />
                  <Legend />
                  <Bar dataKey="出勤時間" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text>No yearly data available.</Text>
            )}
          </GridItem>
        </Grid>
      )}
    </Box>
  );
};

export default DataTab;