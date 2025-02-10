import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Button, Link as ChakraLink } from '@chakra-ui/react'
import { Box } from '@chakra-ui/react'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

import { Container } from '../components/Container'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
// データタブのページ
import { DataPage } from './data'; // DataPageをインポート
// メインタブのページ
import MainPage from './main';

const sectionMarginTop = 5;

export default function HomePage() {
  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-chakra-ui)</title>
      </Head>
      <Container>
        <Tabs isFitted mt={sectionMarginTop} variant="enclosed" width="100%">
          <TabList>
            <Tab>メイン</Tab>
            <Tab>データ</Tab>
            <Tab>管理</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <MainPage />
            </TabPanel>
            <TabPanel>
              <DataPage />
            </TabPanel>
            <TabPanel>
              <div>管理画面のコンテンツ</div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </React.Fragment>
  )
}
