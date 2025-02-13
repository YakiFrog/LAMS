import React, { useState, useEffect, useCallback } from 'react';
import { Box, Heading, Text, Wrap, WrapItem, Divider, useTheme, IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast, Flex } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface Student {
  id: string;
  name: string;
  grade: string;
}

const MainTab: React.FC = () => {
  const [students, setStudents] = useState<{ [grade: string]: Student[] }>({
    M2: [],
    M1: [],
    B4: [],
  });
  const fontSize = '2xl'; // 文字サイズを調整するための変数（文字サイズは 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl' のいずれか）
  const theme = useTheme();
  const fontSizePixel = theme.fontSizes[fontSize]; // fontSizeに対応するピクセル値を取得

  // 5文字分の幅を計算 (例: 1文字あたりfontSizePixelの0.8倍)
  const width = parseFloat(fontSizePixel) * 5 * 0.8;

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState<{ [studentId: string]: '出勤' | '退勤' | null }>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
      const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL and Anon Key are not set.');
        return;
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      const { data: studentsData, error } = await supabaseClient
        .from('students')
        .select('*');

      if (error) {
        console.error('Error fetching students:', error);
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
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchInitialAttendance = async () => {
      const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
      const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL and Anon Key are not set.');
        return;
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      const initialStatus: { [studentId: string]: '出勤' | '退勤' | null } = {};

      for (const grade in students) {
        for (const student of students[grade]) {
          const { data: attendanceData, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('student_id', student.id)
            .order('timestamp', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching attendance:', error);
            continue;
          }

          if (attendanceData && attendanceData.length > 0) {
            initialStatus[student.id] = attendanceData[0].status as '出勤' | '退勤';
          } else {
            initialStatus[student.id] = null;
          }
        }
      }
      setAttendanceStatus(initialStatus);
    };
    fetchInitialAttendance();
  }, [students]);

  const handleAddStudent = useCallback((grade: string) => {
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
  }, []);

  const handleRemoveStudent = useCallback((grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      if (currentStudents.length === 0) return prevStudents;
      return {
        ...prevStudents,
        [grade]: currentStudents.slice(0, -1),
      };
    });
  }, []);

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleAttendance = async (status: '出勤' | '退勤') => {
    if (!selectedStudent) return;

    if (status === '退勤' && attendanceStatus[selectedStudent] !== '出勤') {
      toast({
        title: 'Cannot Record 退勤',
        description: `This student is not currently marked as 出勤.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
    const supabaseAnonKey = localStorage.getItem('supabaseAnonKey') || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL and Anon Key are not set.');
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const studentId = selectedStudent;

    const { error: attendanceError } = await supabaseClient
      .from('attendance')
      .insert([
        { student_id: studentId, status: status, timestamp: new Date() },
      ]);

    if (attendanceError) {
      console.error('Error recording attendance:', attendanceError);
      toast({
        title: 'Attendance Failed',
        description: 'There was an error recording attendance.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    handleCloseModal();
    toast({
      title: 'Attendance Recorded',
      description: `Successfully recorded ${status} for the student.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setAttendanceStatus((prevStatus) => ({
      ...prevStatus,
      [selectedStudent]: status,
    }));
  };

  return (
    <Box 
      textAlign="left" 
      pt={0} 
      height="100%"
      overflowY="auto"
      maxHeight="90vh"  // 画面の高さに合わせて調整
    >
      {/* <Heading as="h2" size="lg" fontSize={fontSize}>
        メインタブ
      </Heading>
      <Text fontSize={fontSize}>出勤・退勤操作を行います。</Text> */}

      {['M2', 'M1', 'B4'].map((section) => (
        <Box key={section} mb={4}>
          <Heading as="h3" size="md" fontSize={fontSize}>
            {section}
          </Heading>
          <Divider my={2} /> {/* Dividerを追加 */}
          <Wrap maxWidth="none" border={`1px solid ${theme.colors.gray[200]}`} borderRadius="md" p={2} spacing={2}>
            {students[section]?.map((student, index) => (
              <WrapItem key={`${student.id}-${index}`} flexBasis="calc(100% / 5)">
                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  boxShadow="sm"
                  fontSize="xl" // 学生名の文字サイズを調整
                  width="100%"
                  minWidth="180px" // Minimum widthを設定
                  textAlign="center"
                  margin={0}
                  cursor="pointer" // カーソルを変更
                  onClick={() => handleStudentClick(student)} // クリックイベントを追加
                  borderColor={
                    attendanceStatus[student.id] === '退勤' ? 'red.500' :
                      attendanceStatus[student.id] === '出勤' ? 'blue.500' : 'gray.200'
                  }
                  position="relative" // 相対位置指定
                >
                  <Text
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {student.name}
                  </Text>
                  {attendanceStatus[student.id] && (
                    <Text
                      position="absolute" // 絶対位置指定
                      bottom="0"
                      right="0"
                      fontSize="sm"
                      color={
                        attendanceStatus[student.id] === '退勤' ? 'red.500' : 'blue.500'
                      }
                      padding="0.1rem 0.3rem"
                    >
                      {attendanceStatus[student.id]}
                    </Text>
                  )}
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      ))}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} isCentered>
        <ModalOverlay />
        <ModalContent
          style={{
            maxWidth: '300px', // モーダルの最大幅を設定
            width: '100%',
            aspectRatio: '1 / 1', // 1:1のアスペクト比を設定
          }}
        >
          <ModalHeader>{students.M2.find(s => s.id === selectedStudent)?.name ||
            students.M1.find(s => s.id === selectedStudent)?.name ||
            students.B4.find(s => s.id === selectedStudent)?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontSize="xs"
            >Student ID: {selectedStudent}</Text>
          </ModalBody>
          <Flex justify="center" pb={4}>
            <Button colorScheme="blue" mr={3} onClick={() => handleAttendance('出勤')}>
              出勤
            </Button>
            <Button colorScheme="red" onClick={() => handleAttendance('退勤')}>
              退勤
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MainTab;