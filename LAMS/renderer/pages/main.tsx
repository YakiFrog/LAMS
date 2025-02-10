import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { StudentSection } from '../components/StudentSection';
// supabaseのインポート
import { supabase } from '../utils/supabase';

export const MainPage = () => {
  const sectionMarginTop = 5;
  const m2Students: string[] = ["M2-A", "M2-B", "M2-C"];
  const m1Students: string[] = ["M1-A", "M1-B", "M1-C"];
  const b4Students: string[] = ["B4-A", "B4-B", "B4-C"];

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const handleStudentClick = (studentName: string) => {
    setSelectedStudent(studentName);
  };

  const handleClosePopup = () => {
    setSelectedStudent(null);
  };

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
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost">出勤</Button>
            <Button variant="ghost">退勤</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default MainPage;