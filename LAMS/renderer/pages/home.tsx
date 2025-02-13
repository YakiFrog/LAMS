import React from 'react';
import MainTab from './MainTab';
import DataTab from './DataTab';
import AdminTab from './AdminTab';
import { Tabs, TabList, TabPanels, Tab, TabPanel, useMediaQuery } from '@chakra-ui/react';

const Home: React.FC = () => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh', // viewportの高さいっぱいにする
    width: '100%', // 親要素の幅を100%使用
  };

  const [isLargerThan480] = useMediaQuery('(min-width: 480px)')

  const squareStyle = {
    width: 'min(95vw, 95vh)', // viewportの幅と高さの小さい方の90%を採用
    height: 'min(95vw, 95vh)',
    border: '1px solid black',
    boxSizing: 'border-box' as 'border-box', // padding, borderをwidth, heightに含める
    display: 'flex',
    flexDirection: 'column' as 'column',
    margin: '10px 0', // 上下に20pxのマージンを追加
    overflow: 'hidden', // Add overflow hidden
    fontSize: isLargerThan480 ? '16px' : '10px', // Adjust font size based on screen size
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // Add shadow
  };

  const tabsStyle = {
    height: '100%', // Tabsコンポーネントの高さをsquareStyleに合わせる
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const tabPanelsStyle = {
    flex: 1, // TabPanelが利用可能なスペースを埋めるようにする
    overflow: 'auto', // 必要に応じてスクロールを許可
  };

  return (
    <div style={containerStyle}>
      <div style={squareStyle}>
        <Tabs align="center" isFitted paddingX={4} style={tabsStyle} fontSize={squareStyle.fontSize as string}>
          <TabList>
            <Tab>メイン</Tab>
            <Tab>データ</Tab>
            <Tab>管理</Tab>
          </TabList>

          <TabPanels style={tabPanelsStyle}>
            <TabPanel border="1px solid" borderRadius="md" marginTop={2} height="98%">
              <MainTab />
            </TabPanel>
            <TabPanel border="1px solid" borderRadius="md" marginTop={2} height="98%">
              <DataTab />
            </TabPanel>
            <TabPanel border="1px solid" borderRadius="md" marginTop={2} height="98%">
              <AdminTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
