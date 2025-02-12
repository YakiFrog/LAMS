import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Wrap, WrapItem, Divider, useTheme } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';

const MainTab: React.FC = () => {
  const [students, setStudents] = useState<{ [grade: string]: string[] }>({});
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
      const groupedStudents: { [grade: string]: string[] } = {};
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

  return (
    <Box textAlign="left">
      <Heading as="h2" size="lg" fontSize={fontSize}>
        メインタブ
      </Heading>
      <Text fontSize={fontSize}>出勤・退勤操作を行います。</Text>

      {['M2', 'M1', 'B4'].map((section) => (
        students[section] ? (
          <Box key={section} mt={4}>
            <Heading as="h3" size="md" fontSize={fontSize}>
              {section}
            </Heading>
            <Divider my={2} /> {/* Dividerを追加 */}
            <Wrap whiteSpace="nowrap">
              {students[section].map((student) => (
                <WrapItem key={student}>
                  <Box
                    borderWidth="1px"
                    borderRadius="md"
                    p={2}
                    boxShadow="sm"
                    fontSize={fontSize} // 学生名の文字サイズを調整
                  >
                    {student}
                  </Box>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        ) : null
      ))}
    </Box>
  );
};

export default MainTab;