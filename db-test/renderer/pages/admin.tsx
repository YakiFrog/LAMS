import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type AdminProps = {
  onSettingsChange: (url: string, key: string) => void;
};

const Admin: React.FC<AdminProps> = ({ onSettingsChange }) => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('supabaseUrl') || '' : '';
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('supabaseAnonKey') || '' : '';
  });
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const toast = useToast();

  const handleSubmit = (e: any) => {
    e.preventDefault();

    onSettingsChange(supabaseUrl, supabaseAnonKey);
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

  return (
    <Box p={4}>
      <Heading mb={4}>Admin Page</Heading>
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

      <Heading size="md" mb={2}>
        Add New Student
      </Heading>
      <form onSubmit={handleAddStudent}>
        <FormControl mb={4}>
          <FormLabel>Name:</FormLabel>
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Grade:</FormLabel>
          <Input
            type="text"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="teal" type="submit">
          Add Student
        </Button>
      </form>
    </Box>
  );
};

export default Admin;