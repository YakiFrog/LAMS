import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Select, FormControl, FormLabel } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
      if (!selectedStudentId) return;

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
      const weekly: { [week: string]: { 出勤時間: number } } = {};

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const week = `${date.getFullYear()}-W${getWeek(date)}`;

        if (!weekly[week]) {
          weekly[week] = { 出勤時間: 0 };
        }
      });

      const weeklyArray = Object.entries(weekly).map(([week, data]) => {
        let totalWorkTime = 0;
        let lastCheckInTime: Date | null = null;

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordWeek = `${recordDate.getFullYear()}-W${getWeek(recordDate)}`;

          if (week === recordWeek) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              totalWorkTime += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return { week, 出勤時間: typeof totalWorkTime === 'number' ? formatTime(totalWorkTime) : '0 時間' };
      });

      setWeeklyData(weeklyArray);
    };

    // Process monthly data
    const processMonthlyData = () => {
      const monthly: { [month: string]: { 出勤時間: number } } = {};

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthly[month]) {
          monthly[month] = { 出勤時間: 0 };
        }
      });

      const monthlyArray = Object.entries(monthly).map(([month, data]) => {
        let totalWorkTime = 0;
        let lastCheckInTime: Date | null = null;

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordMonth = `${recordDate.getFullYear()}-${recordDate.getMonth() + 1}`;

          if (month === recordMonth) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              totalWorkTime += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return { month, 出勤時間: typeof totalWorkTime === 'number' ? formatTime(totalWorkTime) : '0 時間' };
      });

      setMonthlyData(monthlyArray);
    };

    // Process yearly data
    const processYearlyData = () => {
      const yearly: { [year: string]: { 出勤時間: number } } = {};

      attendanceData.forEach((record) => {
        const date = new Date(record.timestamp);
        const year = `${date.getFullYear()}`;

        if (!yearly[year]) {
          yearly[year] = { 出勤時間: 0 };
        }
      });

      const yearlyArray = Object.entries(yearly).map(([year, data]) => {
        let totalWorkTime = 0;
        let lastCheckInTime: Date | null = null;

        attendanceData.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          const recordYear = `${recordDate.getFullYear()}`;

          if (year === recordYear) {
            if (record.status === '出勤') {
              lastCheckInTime = recordDate;
            } else if (record.status === '退勤' && lastCheckInTime) {
              const timeDiff = recordDate.getTime() - lastCheckInTime.getTime();
              totalWorkTime += timeDiff / (60 * 60 * 1000); // Convert milliseconds to hours
              lastCheckInTime = null;
            }
          }
        });

        return { year, 出勤時間: typeof totalWorkTime === 'number' ? formatTime(totalWorkTime) : '0 時間' };
      });

      setYearlyData(yearlyArray);
    };

    if (attendanceData.length > 0) {
      processWeeklyData();
      processMonthlyData();
      processYearlyData();
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

  // Function to format time
  const formatTime = (hours: number) => {
    if (hours >= 1) {
      return `${hours.toFixed(2)} 時間`;
    } else if (hours * 60 >= 1) {
      return `${(hours * 60).toFixed(2)} 分`;
    } else {
      return `${(hours * 60 * 60).toFixed(2)} 秒`;
    }
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
        <>
          <Heading as="h3" size="md" mt={4}>
            週ごとの出勤時間
          </Heading>
          {weeklyData.length > 0 ? (
            <BarChart width={700} height={300} data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(0)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Tooltip formatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(2)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(2)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Legend />
              <Bar dataKey="出勤時間" fill="#8884d8" />
            </BarChart>
          ) : (
            <Text>No weekly data available.</Text>
          )}

          <Heading as="h3" size="md" mt={4}>
            月ごとの出勤時間
          </Heading>
          {monthlyData.length > 0 ? (
            <BarChart width={700} height={300} data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(0)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Tooltip formatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(2)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(2)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Legend />
              <Bar dataKey="出勤時間" fill="#8884d8" />
            </BarChart>
          ) : (
            <Text>No monthly data available.</Text>
          )}

          <Heading as="h3" size="md" mt={4}>
            年ごとの出勤時間
          </Heading>
          {yearlyData.length > 0 ? (
            <BarChart width={700} height={300} data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(0)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(0)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(0)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Tooltip formatter={(value) => {
                  if (typeof value === 'number') {
                      if (value >= 1) {
                          return `${value.toFixed(2)} 時間`;
                      } else if (value * 60 >= 1) {
                          return `${(value * 60).toFixed(2)} 分`;
                      } else {
                          return `${(value * 60 * 60).toFixed(2)} 秒`;
                      }
                  }
                  return value;
              }}/>
              <Legend />
              <Bar dataKey="出勤時間" fill="#8884d8" />
            </BarChart>
          ) : (
            <Text>No yearly data available.</Text>
          )}
        </>
      )}
    </Box>
  );
};

export default DataTab;