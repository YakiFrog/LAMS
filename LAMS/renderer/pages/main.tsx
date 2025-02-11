import React, { useState, useEffect } from 'react';
import { Container } from '../components/Container';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from '@chakra-ui/react';
import { StudentSection } from '../components/StudentSection';
import { supabase } from '../utils/supabaseClient';
import { AttendanceButtons } from '../components/AttendanceButtons';

export const MainPage = () => {
  const sectionMarginTop = 5;
  const m2Students: string[] = ["M2-A", "M2-B", "M2-C"];
  const m1Students: string[] = ["M1-A", "M1-B", "M1-C"];
  const b4Students: string[] = ["小谷亮太", "B4-B", "B4-C"];

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any[]>([]);

  const handleStudentClick = (studentName: string) => {
    setSelectedStudent(studentName);
  };

  const handleClosePopup = () => {
    setSelectedStudent(null);
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      if (selectedStudent) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('name', selectedStudent);

        if (error) {
          console.error('Error fetching student data:', error);
        } else {
          setStudentData(data || []);
        }
      } else {
        setStudentData([]);
      }
    };

    fetchStudentData();
  }, [selectedStudent]);

  return (
    <Container>
      <Box mt={sectionMarginTop}>
        <StudentSection title="M2" studentNames={m2Students} onStudentClick={handleStudentClick} />
      </Box>
      <Box mt={sectionMarginTop}>
        <StudentSection title="M1" studentNames={m1Students} onStudentClick={handleStudentClick} />
      </Box>
      <Box mt={sectionMarginTop}>
        <StudentSection title="B4" studentNames={b4Students} onStudentClick={handleStudentClick} />
      </Box>
      <Modal isOpen={!!selectedStudent} onClose={handleClosePopup} isCentered>
        <ModalOverlay />
        <ModalContent maxW="80vw">
          <ModalHeader>{selectedStudent}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>出勤・退勤を選択してください。</p>
            {studentData.length > 0 ? (
              studentData.map((student) => (
                <Box key={student.id}>
                  <Text>ID: {student.id}</Text>
                  <Text>Name: {student.name}</Text>
                  <Text>Grade: {student.grade}</Text>
                </Box>
              ))
            ) : (
              <Text>No student data found.</Text>
            )}
          </ModalBody>

          <ModalFooter>
            <AttendanceButtons studentName={selectedStudent || ''} onClose={handleClosePopup} />
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box mt={sectionMarginTop}>
        {studentData.length > 0 ? (
          studentData.map((student) => (
            <Box key={student.id}>
              <Text>ID: {student.id}</Text>
              <Text>Name: {student.name}</Text>
              <Text>Grade: {student.grade}</Text>
            </Box>
          ))
        ) : (
          <Text>No student data found.</Text>
        )}
      </Box>
    </Container>
  );
};

export default MainPage;