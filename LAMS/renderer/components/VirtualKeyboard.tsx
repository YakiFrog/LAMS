import React from 'react';
import { Box, Button, SimpleGrid } from '@chakra-ui/react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete?: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onDelete }) => {
  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'del' && onDelete) {
      onDelete();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <Box>
      {keys.map((row, index) => (
        <SimpleGrid columns={row.length} spacing={1} key={index} mb={1}>
          {row.map((key) => (
            <Button key={key} onClick={() => handleKeyPress(key)}>
              {key}
            </Button>
          ))}
        </SimpleGrid>
      ))}
    </Box>
  );
};

export default VirtualKeyboard;