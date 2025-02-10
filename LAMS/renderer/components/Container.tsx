import React from 'react';
import { Box } from '@chakra-ui/react';

interface ContainerProps {
  children: React.ReactNode;
  minHeight?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, minHeight }) => {
  return (
    <Box
      minHeight={minHeight}
      display="flex"
      flexDirection="column"
      alignItems="stretch" // stretch: 親要素の幅いっぱいに子要素を広げる
      justifyContent="flex-start" // flex-start: 親要素の上端に子要素を配置
      maxWidth="container.xl"
      mx="auto"
      px={1}
      // 縁取り
      border="1px solid #ddd"
    >
      {children}
    </Box>
  );
};
