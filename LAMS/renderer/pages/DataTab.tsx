import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const DataTab: React.FC = () => {
  return (
    <Box textAlign="left">
      <Heading as="h2" size="lg">
        データタブ
      </Heading>
      <Text>個別の出勤数を表示します。</Text>
    </Box>
  );
};

export default DataTab;