import React, { useState } from 'react';
import { Box, Heading, useColorModeValue, Button, HStack, IconButton, Wrap, Flex } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface StudentSectionProps {
  title: string;
  studentNames: string[];
  onStudentClick: (studentName: string) => void;
}

export const StudentSection: React.FC<StudentSectionProps> = ({ title, studentNames, onStudentClick }) => {
  const textColor = useColorModeValue('black', 'white');
  const [students, setStudents] = useState(studentNames);

  const addStudent = () => {
    setStudents([...students, `New Student ${students.length + 1}`]);
  };

  const removeStudent = () => {
    if (students.length > 0) {
      setStudents(students.slice(0, -1));
    }
  };

  return (
    <Box textAlign="left"
      // 縁取り
      border="1px solid #ddd"
      maxWidth="lm" // 最大幅を調整
    >
      <Flex align="center" mb={2}>
        <Heading size="md" color={textColor}>{title}</Heading>
        <HStack spacing={3} ml="auto">
          <IconButton
            aria-label="Add student"
            icon={<AddIcon />}
            onClick={addStudent}
            size="sm"
          />
          <IconButton
            aria-label="Remove student"
            icon={<MinusIcon />}
            onClick={removeStudent}
            size="sm"
            isDisabled={students.length === 0}
          />
        </HStack>
      </Flex>
      <Wrap mt={2} spacing={3}>
        {students.map((name) => (
          <Button
            key={name}
            color={textColor}
            variant='ghost'
            border="1px solid"
            onClick={() => onStudentClick(name)}
          >
            {name}
          </Button>
        ))}
      </Wrap>
    </Box>
  );
};
