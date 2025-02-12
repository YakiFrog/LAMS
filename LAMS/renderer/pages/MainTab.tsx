import React, { useState, useEffect, useCallback } from 'react';
import { Box, Heading, Text, Wrap, WrapItem, Divider, useTheme, IconButton } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

const MainTab: React.FC = () => {
  const [students, setStudents] = useState<{ [grade: string]: string[] }>({
    M2: [],
    M1: [],
    B4: [],
  });
  const fontSize = '3xl'; // 文字サイズを調整するための変数（文字サイズは 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl' のいずれか）
  const theme = useTheme();
  const fontSizePixel = theme.fontSizes[fontSize]; // fontSizeに対応するピクセル値を取得

  // 5文字分の幅を計算 (例: 1文字あたりfontSizePixelの0.8倍)
  const width = parseFloat(fontSizePixel) * 5 * 0.8;

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
      const groupedStudents: { [grade: string]: string[] } = { M2: [], M1: [], B4: [] };
      studentsData.forEach((student) => {
        if (!groupedStudents[student.grade]) {
          groupedStudents[student.grade] = [];
        }
        groupedStudents[student.grade].push(student.name);
      });

      setStudents(groupedStudents);
    };

    fetchData();
  }, []);

  const handleAddStudent = useCallback((grade: string) => {
    setStudents((prevStudents) => {
      const currentStudents = prevStudents[grade] || [];
      const newStudentName = `学生${currentStudents.length + 1}`;
      return {
        ...prevStudents,
        [grade]: [...currentStudents, newStudentName],
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

  return (
    <Box textAlign="left">
      {/* <Heading as="h2" size="lg" fontSize={fontSize}>
        メインタブ
      </Heading>
      <Text fontSize={fontSize}>出勤・退勤操作を行います。</Text> */}

      {['M2', 'M1', 'B4'].map((section) => (
        <Box key={section} mt={4}>
          <Heading as="h3" size="md" fontSize={fontSize}>
            {section}
            <IconButton
              aria-label={`Add student to ${section}`}
              icon={<AddIcon />}
              size="sm"
              ml={2}
              onClick={() => handleAddStudent(section)}
            />
            <IconButton
              aria-label={`Remove student from ${section}`}
              icon={<MinusIcon />}
              size="sm"
              ml={2}
              onClick={() => handleRemoveStudent(section)}
            />
          </Heading>
          <Divider my={2} /> {/* Dividerを追加 */}
          <Wrap maxWidth="none" border={`1px solid ${theme.colors.gray[200]}`} borderRadius="md" p={2} spacing={2}>
            {students[section]?.map((student, index) => (
              <WrapItem key={`${student}-${index}`} flexBasis="calc(100% / 5)">
                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  boxShadow="sm"
                  fontSize={fontSize} // 学生名の文字サイズを調整
                  width="100%"
                  textAlign="center"
                  margin={0}
                >
                  {student}
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      ))}
    </Box>
  );
};

export default MainTab;