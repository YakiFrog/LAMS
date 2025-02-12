import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Select,
} from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';

const AdminTab: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('supabaseUrl') || '' : '';
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('supabaseAnonKey') || '' : '';
  });
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [deleteGrade, setDeleteGrade] = useState('');
  const [deleteName, setDeleteName] = useState('');
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    const fetchStudentsByGrade = async () => {
      if (deleteGrade && supabaseUrl && supabaseAnonKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('grade', deleteGrade);

        if (error) {
          console.error('Error fetching students:', error);
        } else {
          setStudentList(data || []);
        }
      }
    };

    fetchStudentsByGrade();
  }, [deleteGrade]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseAnonKey', supabaseAnonKey);

    toast({
      title: 'Success',
      description: 'Supabase settings updated!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAddStudent = async (e: any) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'Error',
        description: 'Supabase URL and Anon Key are not set.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    if (!supabaseClient) {
      toast({
        title: 'Error',
        description: 'Supabase URL and Anon Key are not set.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const { data: newStudent, error } = await supabaseClient
      .from('students')
      .insert([{ name: newName, grade: newGrade }])
      .select();

    if (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      setNewName('');
      setNewGrade('');
      toast({
        title: 'Success',
        description: 'Student added successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'Error',
        description: 'Supabase URL and Anon Key are not set.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    if (window.confirm('Are you sure you want to delete all students? This action cannot be undone.')) {
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .neq('name', null); // RLSを考慮して、nameがnullでないものを削除

      if (error) {
        console.error('Error deleting all students:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Success',
          description: 'All students deleted successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteStudent = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'Error',
        description: 'Supabase URL and Anon Key are not set.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!deleteGrade || !selectedStudentId) {
      toast({
        title: 'Error',
        description: 'Please select both grade and student.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const selectedStudent = studentList.find(student => student.id === selectedStudentId);

    if (window.confirm(`Are you sure you want to delete ${selectedStudent.name} from ${deleteGrade}?`)) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // 出席記録の削除
      const { error: deleteAttendanceError } = await supabaseClient
        .from('attendance')
        .delete()
        .eq('student_id', selectedStudentId);

      if (deleteAttendanceError) {
        console.error('Error deleting attendance records:', deleteAttendanceError);
        toast({
          title: 'Error',
          description: deleteAttendanceError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // 学生の削除
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .eq('id', selectedStudentId);

      if (error) {
        console.error('Error deleting student:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setSelectedStudentId('');
        setStudentList(prevList => prevList.filter(student => student.id !== selectedStudentId));
        toast({
          title: 'Success',
          description: 'Student deleted successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box textAlign="left" p={4}>
      {/* <Heading as="h2" size="lg" mb={4}>
        管理タブ
      </Heading>
      <Text mb={4}>URL, KEY, 学生の追加・削除を行います。</Text> */}

      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Supabase URL:</FormLabel>
          <Input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Supabase Anon Key:</FormLabel>
          <Input
            type="text"
            value={supabaseAnonKey}
            onChange={(e) => setSupabaseAnonKey(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="teal" type="submit">
          Update Settings
        </Button>
      </form>

      <Heading size="md" mb={2} mt={6}>
        学生を追加
      </Heading>
      <form onSubmit={handleAddStudent}>
        <FormControl mb={4}>
          <FormLabel>学年:</FormLabel>
          <Select
            placeholder="学年を選択"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
          >
            <option value="B4">B4</option>
            <option value="M1">M1</option>
            <option value="M2">M2</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>名前:</FormLabel>
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="teal" type="submit">
          追加
        </Button>
      </form>

      <Heading size="md" mb={2} mt={6}>
        指定した学生を削除
      </Heading>
      <FormControl mb={4}>
        <FormLabel>学年:</FormLabel>
        <Select
          placeholder="学年を選択"
          value={deleteGrade}
          onChange={(e) => {
            setDeleteGrade(e.target.value);
            setSelectedStudentId('');
          }}
        >
          <option value="B4">B4</option>
          <option value="M1">M1</option>
          <option value="M2">M2</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>学生:</FormLabel>
        <Select
          placeholder="学生を選択"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {studentList.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <Button colorScheme="red" onClick={handleDeleteStudent}>
        削除
      </Button>

      <Box display="flex" alignItems="center" mt={6} mb={4}>
        <Heading size="md" mr={2} pr={5}>
          全学生を削除
        </Heading>
        <Button colorScheme="red" onClick={handleDeleteAllStudents}>
          削除
        </Button>
      </Box>
    </Box>
  );
};

export default AdminTab;