import React from 'react';
import MainTab from './MainTab';
import DataTab from './DataTab';
import AdminTab from './AdminTab';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

const Home: React.FC = () => {
  return (
    <Tabs align="center" isFitted paddingX={4}>
      <TabList>
        <Tab>メイン</Tab>
        <Tab>データ</Tab>
        <Tab>管理</Tab>
      </TabList>

      <TabPanels>
        <TabPanel border="1px solid">
          <MainTab />
        </TabPanel>
        <TabPanel border="1px solid">
          <DataTab />
        </TabPanel>
        <TabPanel border="1px solid">
          <AdminTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default Home;
