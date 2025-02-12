import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '../supabaseClient';

type AttendanceProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const Attendance: React.FC<AttendanceProps> = ({ supabaseUrl, supabaseAnonKey }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

      if (!supabase) {
        return;
      }

      const { data: fetchedAttendanceRecords, error } = await supabase
        .from('attendance')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setAttendanceRecords(fetchedAttendanceRecords);
      }
    };

    fetchAttendanceRecords();
  }, [supabaseUrl, supabaseAnonKey]);

  return (
    <Box p={4}>
      <Heading mb={4}>Attendance Records</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Student ID</Th>
            <Th>Status</Th>
            <Th>Timestamp</Th>
          </Tr>
        </Thead>
        <Tbody>
          {attendanceRecords.map(record => (
            <Tr key={record.id}>
              <Td>{record.student_id}</Td>
              <Td>{record.status}</Td>
              <Td>{record.timestamp}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Attendance;
