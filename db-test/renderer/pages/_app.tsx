import { ChakraProvider, Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import theme from '../lib/theme';
import { AppProps } from 'next/app';
import Home from './home';
import Admin from './admin';
import Attendance from './attendance';
import { useState, useCallback } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  const handleSettingsChange = useCallback((url: string, key: string) => {
    setSupabaseUrl(url);
    setSupabaseAnonKey(key);
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Box p={4}>
        <Heading mb={4}>LAMS</Heading>
        <Tabs isFitted variant="enclosed">
          <TabList mb={4}>
            <Tab>Home</Tab>
            <Tab>Admin</Tab>
            <Tab>Attendance</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Home supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </TabPanel>
            <TabPanel>
              <Admin onSettingsChange={handleSettingsChange} />
            </TabPanel>
            <TabPanel>
              <Attendance supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ChakraProvider>
  );
}

export default MyApp;
