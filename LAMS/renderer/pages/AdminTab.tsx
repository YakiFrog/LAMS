import React, { useState } from 'react';
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
  const toast = useToast();

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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    if (!deleteGrade || !deleteName) {
      toast({
        title: 'Error',
        description: 'Please specify both grade and name to delete.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${deleteName} from ${deleteGrade}?`)) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // service_roleを使用してidを取得
      const { data: studentsData, error: selectError } = await supabaseClient
        .from('students')
        .select('id')
        .eq('name', deleteName)
        .eq('grade', deleteGrade);

      if (selectError) {
        console.error('Error selecting student:', selectError);
        toast({
          title: 'Error',
          description: selectError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!studentsData || studentsData.length === 0) {
        toast({
          title: 'Error',
          description: 'No student found with the specified name and grade.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const studentId = studentsData[0].id;

      const { error: deleteAttendanceError } = await supabaseClient
        .from('attendance')
        .delete()
        .eq('student_id', studentId);

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

      // studentsテーブルからレコードを削除
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .eq('name', deleteName)
        .eq('grade', deleteGrade);

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
      <Heading as="h2" size="lg" mb={4}>
        管理タブ
      </Heading>
      <Text mb={4}>URL, KEY, 学生の追加・削除を行います。</Text>

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
        Add New Student
      </Heading>
      <form onSubmit={handleAddStudent}>
        <FormControl mb={4}>
          <FormLabel>Grade:</FormLabel>
          <Select
            placeholder="Select grade"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
          >
            <option value="B4">B4</option>
            <option value="M1">M1</option>
            <option value="M2">M2</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Name:</FormLabel>
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="teal" type="submit">
          Add Student
        </Button>
      </form>

      <Heading size="md" mb={2} mt={6}>
        Delete Specific Student
      </Heading>
      <FormControl mb={4}>
        <FormLabel>Grade:</FormLabel>
        <Select
          placeholder="Select grade"
          value={deleteGrade}
          onChange={(e) => setDeleteGrade(e.target.value)}
        >
          <option value="B4">B4</option>
          <option value="M1">M1</option>
          <option value="M2">M2</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Name:</FormLabel>
        <Input
          type="text"
          value={deleteName}
          onChange={(e) => setDeleteName(e.target.value)}
        />
      </FormControl>

      <Button colorScheme="red" onClick={handleDeleteStudent}>
        Delete Student
      </Button>

      <Heading size="md" mb={2} mt={6}>
        Delete All Students
      </Heading>
      <Button colorScheme="red" onClick={handleDeleteAllStudents} mb={4}>
        Delete All Students
      </Button>
    </Box>
  );
};

export default AdminTab;