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
      alignItems="flex-start"
      justifyContent="flex-start"
      maxWidth="container.xl"
      mx="auto"
      px={6}
      // 縁取り
      border="1px solid #ddd"
    >
      {children}
    </Box>
  );
};
