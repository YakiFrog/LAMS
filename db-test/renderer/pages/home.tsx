import { useEffect, useState } from 'react';
import { createSupabaseClient } from '../supabaseClient';
import {
  Box,
  Heading,
  List,
  ListItem,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';

type HomeProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const Home: React.FC<HomeProps> = ({ supabaseUrl, supabaseAnonKey }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

      if (!supabase) {
        return;
      }

      const { data: fetchedStudents, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setStudents(fetchedStudents);
      }
    };

    fetchStudents();
  }, [supabaseUrl, supabaseAnonKey]);

  const getStudentsByGrade = (grade: string) => {
    return students.filter(student => student.grade === grade);
  };

  const renderStudentList = (grade: string) => {
    const studentsOfGrade = getStudentsByGrade(grade);

    if (studentsOfGrade.length === 0) {
      return null;
    }

    const longestName = studentsOfGrade.reduce((max, student) => {
      return Math.max(max, student.name.length);
    }, 0);

    const boxWidth = Math.max(100, longestName * 10); // Adjust 10 based on your font size

    return (
      <Box mb={4}>
        <Heading size="md" mb={2}>
          {grade}
        </Heading>
        <Wrap>
          {studentsOfGrade.map(student => (
            <WrapItem key={student.id}>
              <Box
                borderWidth="1px"
                borderRadius="md"
                p={2}
                width="auto"
                minWidth={`${boxWidth}px`}
                textAlign="center"
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
    );
  };

  return (
    <Box p={4}>
      <Heading mb={4}>学生一覧</Heading>
      {renderStudentList('M2')}
      {renderStudentList('M1')}
      {renderStudentList('B4')}
    </Box>
  );
};

export default Home;