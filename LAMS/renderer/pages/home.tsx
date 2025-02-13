import React, { useState, useEffect } from 'react';
import MainTab from './MainTab';
import DataTab from './DataTab';
import AdminTab from './AdminTab';
import { Tabs, TabList, TabPanels, Tab, TabPanel, useMediaQuery, Button, Flex } from '@chakra-ui/react';
import { FaRedo } from 'react-icons/fa';
import { useRouter } from 'next/router';

const Home: React.FC = () => {
  const router = useRouter();
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh', // viewportの高さいっぱいにする
    width: '100%', // 親要素の幅を100%使用
  };

  // フォントサイズの定数を追加
  const FONT_SIZES = {
    tab: {
      large: '1.25rem',
      small: '0.875rem'
    },
    content: {
      large: '1rem',
      small: '0.75rem'
    }
  };

  const [isLargerThan480] = useMediaQuery('(min-width: 480px)')
  const [tabIndex, setTabIndex] = useState(0); // Track the active tab

  useEffect(() => {
    // ページロード時にローカルストレージからタブのインデックスを読み込む
    const storedTabIndex = localStorage.getItem('tabIndex');
    if (storedTabIndex) {
      setTabIndex(parseInt(storedTabIndex, 10));
    }
  }, []);

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    // タブが変更されたときにローカルストレージにインデックスを保存
    localStorage.setItem('tabIndex', index.toString());
  };

  const handleReload = () => {
    // リロード前に現在のタブのインデックスを保存
    localStorage.setItem('tabIndex', tabIndex.toString());
    router.reload();
  };

  const squareStyle = {
    width: 'min(95vw, 95vh)', // viewportの幅と高さの小さい方の90%を採用
    height: 'min(95vw, 95vh)',
    border: '1px solid black',
    boxSizing: 'border-box' as 'border-box', // padding, borderをwidth, heightに含める
    display: 'flex',
    flexDirection: 'column' as 'column', // Changed back to column
    margin: '10px 0', // 上下に20pxのマージンを追加
    overflow: 'hidden', // Add overflow hidden
    fontSize: isLargerThan480 ? FONT_SIZES.content.large : FONT_SIZES.content.small, // 16px -> 1rem, 10px -> 0.875rem
    boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.2)', // 4px -> 0.25rem, 12px -> 0.75rem
  };

  const tabsStyle = {
    height: '100%', // Tabsコンポーネントの高さをsquareStyleに合わせる
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%', // タブが利用可能な幅を埋めるようにする
  };

  const tabPanelsStyle = {
    flex: 1, // TabPanelが利用可能なスペースを埋めるようにする
    overflow: 'auto', // 必要に応じてスクロールを許可
  };

  const tabListStyle = {
    fontSize: isLargerThan480 ? FONT_SIZES.tab.large : FONT_SIZES.tab.small, // 18px -> 1.125rem, 12px -> 0.75rem
    // Add these styles to align items
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={squareStyle}>
        <Tabs
          align="center"
          isFitted
          paddingX={4}
          style={tabsStyle}
          fontSize={squareStyle.fontSize as string}
          index={tabIndex} // コントロールされたコンポーネントにする
          onChange={handleTabChange} // Handle tab changes
        >
          <TabList style={tabListStyle}>
            <MainTabReloadButton onReload={handleReload} />
            <Tab sx={{ '&:focus': { boxShadow: 'none' } }}>メイン</Tab> {/* Remove focus outline */}
            <Tab sx={{ '&:focus': { boxShadow: 'none' } }}>データ</Tab> {/* Remove focus outline */}
            <Tab sx={{ '&:focus': { boxShadow: 'none' } }}>管理</Tab> {/* Remove focus outline */}
          </TabList>

          <TabPanels style={tabPanelsStyle}>
            <TabPanel border="1px solid" borderRadius="md" marginTop={2} height="98%">
              <MainTab />
            </TabPanel>
            <TabPanel border="1px solid" borderRadius="md" marginTop={2} height="98%" overflow="auto">
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

const MainTabReloadButton = ({ onReload }: { onReload: () => void }) => {
  return (
    <Button
      aria-label="Reload"
      onClick={onReload} // Call the passed reload function
      p={0}
      mr={4}
      colorScheme="blue"
      variant="ghost"
      _hover={{ bg: 'none' }}
      _focus={{ boxShadow: 'none' }}
      minWidth="0"
      sx={{
        '&:after': {
          display: 'none', // Remove the underline
        },
      }}
    >
      <FaRedo /> {/* Use the imported reload icon */}
    </Button>
  );
};

export default Home;
