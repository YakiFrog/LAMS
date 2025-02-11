import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { supabase } from '../utils/supabaseClient';

interface AttendanceButtonsProps {
  studentName: string;
  onClose: () => void;
}

export const AttendanceButtons: React.FC<AttendanceButtonsProps> = ({ studentName, onClose }) => {
  const toast = useToast();

  const recordAttendance = async (type: '出勤' | '退勤') => {
    const now = new Date();
    const formattedTime = now.toISOString();

    const { data, error } = await supabase
      .from('attendances')
      .insert([
        {
          student_name: studentName,
          time: formattedTime,
          type: type,
        },
      ]);

    if (error) {
      console.error('Error recording attendance:', error);
      toast({
        title: 'Error',
        description: `Failed to record ${type}.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      console.log(`${type} recorded successfully:`, data);
      toast({
        title: 'Success',
        description: `${type} recorded successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

  return (
    <>
      <Button variant="ghost" onClick={() => recordAttendance('出勤')}>
        出勤
      </Button>
      <Button variant="ghost" onClick={() => recordAttendance('退勤')}>
        退勤
      </Button>
    </>
  );
};
