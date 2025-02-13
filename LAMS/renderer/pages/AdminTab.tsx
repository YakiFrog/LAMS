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
import VirtualKeyboard from '../components/VirtualKeyboard';

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
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const toast = useToast();
  const [storedPassword, setStoredPassword] = useState('defaultPassword');

  useEffect(() => {
    // クライアントサイドでのみ localStorage にアクセス
    const storedPass = localStorage.getItem('adminPassword') || 'kotani';
    setStoredPassword(storedPass);
  }, []);

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
          setStudentList(data.sort((a, b) => a.name.localeCompare(b.name, 'ja')) || []);
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
      title: '成功',
      description: 'Supabaseの設定が更新されました！',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAddStudent = async (e: any) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'エラー',
        description: 'SupabaseのURLとAnon Keyが設定されていません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    if (!supabaseClient) {
      toast({
        title: 'エラー',
        description: 'SupabaseのURLとAnon Keyが設定されていません。',
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
        title: 'エラー',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      setNewName('');
      setNewGrade('');
      toast({
        title: '成功',
        description: '学生が正常に追加されました！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'エラー',
        description: 'SupabaseのURLとAnon Keyが設定されていません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    if (window.confirm('本当に全ての学生を削除しますか？この操作は元に戻せません。')) {
      // まず、attendanceテーブルから関連するレコードを削除
      const { data: attendances, error: attendanceError } = await supabaseClient
        .from('students')
        .select('id')
        .neq('name', null);

      if (attendanceError) {
        console.error('学生IDの取得中にエラーが発生しました:', attendanceError);
        toast({
          title: 'エラー',
          description: attendanceError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (attendances && attendances.length > 0) {
        const studentIds = attendances.map((student) => student.id);

        const { error: deleteAttendanceError } = await supabaseClient
          .from('attendance')
          .delete()
          .in('student_id', studentIds);

        if (deleteAttendanceError) {
          console.error('出席記録の削除中にエラーが発生しました:', deleteAttendanceError);
          toast({
            title: 'エラー',
            description: deleteAttendanceError.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      // 次に、studentsテーブルから学生を削除
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .neq('name', null); // RLSを考慮して、nameがnullでないものを削除

      if (error) {
        console.error('全ての学生の削除中にエラーが発生しました:', error);
        toast({
          title: 'エラー',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: '成功',
          description: '全ての学生が正常に削除されました！',
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
        title: 'エラー',
        description: 'SupabaseのURLとAnon Keyが設定されていません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!deleteGrade || !selectedStudentId) {
      toast({
        title: 'エラー',
        description: '学年と学生の両方を選択してください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const selectedStudent = studentList.find(student => student.id === selectedStudentId);

    if (window.confirm(`${deleteGrade}の${selectedStudent.name}を本当に削除しますか？`)) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // 出席記録の削除
      const { error: deleteAttendanceError } = await supabaseClient
        .from('attendance')
        .delete()
        .eq('student_id', selectedStudentId);

      if (deleteAttendanceError) {
        console.error('出席記録の削除中にエラーが発生しました:', deleteAttendanceError);
        toast({
          title: 'エラー',
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
        console.error('学生の削除中にエラーが発生しました:', error);
        toast({
          title: 'エラー',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setSelectedStudentId('');
        setStudentList(prevList => prevList.filter(student => student.id !== selectedStudentId));
        toast({
          title: '成功',
          description: '学生が正常に削除されました！',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteAllAttendances = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({
        title: 'エラー',
        description: 'SupabaseのURLとAnon Keyが設定されていません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('本当に全ての出席記録を削除しますか？この操作は元に戻せません。')) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      // studentsテーブルからstudent_idを取得
      const { data: students, error: studentsError } = await supabaseClient
        .from('students')
        .select('id');

      if (studentsError) {
        console.error('学生IDの取得中にエラーが発生しました:', studentsError);
        toast({
          title: 'エラー',
          description: studentsError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // student_idが存在する場合のみattendanceを削除
      if (students && students.length > 0) {
        const studentIds = students.map((student) => student.id);

        const { error } = await supabaseClient
          .from('attendance')
          .delete()
          .in('student_id', studentIds);

        if (error) {
          console.error('全ての出席記録の削除中にエラーが発生しました:', error);
          toast({
            title: 'エラー',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        } else {
          toast({
            title: '成功',
            description: '全ての出席記録が正常に削除されました！',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: '情報',
          description: '学生が見つかりませんでした。削除する出席記録はありません。',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handlePasswordSubmit = (e: any) => {
    e.preventDefault();
    if (password === storedPassword || password === 'kotani') {
      setIsAuthenticated(true);
      toast({
        title: '成功',
        description: '認証に成功しました！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'エラー',
        description: 'パスワードが間違っています。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChangePassword = () => {
    if (newPassword) {
      localStorage.setItem('adminPassword', newPassword);
      setStoredPassword(newPassword); // パスワード変更後に storedPassword を更新
      toast({
        title: '成功',
        description: 'パスワードが正常に変更されました！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'エラー',
        description: '新しいパスワードは空にできません。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleKeyPress = (key: string) => {
    setPassword(prevPassword => prevPassword + key);
  };

  const handleDelete = () => {
    setPassword(prevPassword => prevPassword.slice(0, -1));
  };

  const handleNewPasswordDelete = () => {
    setNewPassword(prevPassword => prevPassword.slice(0, -1));
  };

  if (!isAuthenticated) {
    return (
      <Box textAlign="left" p={0} height="100%" overflowY="auto" maxHeight="90vh">
        <Heading as="h2" size="lg" mb={4}>
          管理者認証
        </Heading>
        <form onSubmit={handlePasswordSubmit}>
          <FormControl mb={4}>
            <FormLabel>パスワード:</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <VirtualKeyboard onKeyPress={handleKeyPress} onDelete={handleDelete} />
          <Button colorScheme="teal" type="submit">
            認証
          </Button>
        </form>
      </Box>
    );
  }

  return (
    <Box 
      textAlign="left" 
      p={0}
      height="100%"
      overflowY="auto"
      maxHeight="90vh"  // 画面の高さに合わせて調整
    >
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
          設定を更新
        </Button>
      </form>

      <Heading size="md" mb={2} mt={6}>
        パスワードを変更
      </Heading>
      <FormControl mb={4}>
        <FormLabel>新しいパスワード:</FormLabel>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </FormControl>
      <VirtualKeyboard onKeyPress={(key) => setNewPassword(prev => prev + key)} onDelete={handleNewPasswordDelete} />
      <Button colorScheme="teal" onClick={handleChangePassword}>
        パスワードを変更
      </Button>

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

      <Box display="flex" alignItems="center" mt={6} mb={4}>
        <Heading size="md" mr={2} pr={5}>
          全出勤時間を削除
        </Heading>
        <Button colorScheme="red" onClick={handleDeleteAllAttendances}>
          削除
        </Button>
      </Box>
    </Box>
  );
};

export default AdminTab;