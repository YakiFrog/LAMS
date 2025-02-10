import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Button, Link as ChakraLink } from '@chakra-ui/react'

import { Container } from '../components/Container'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { StudentSection } from '../components/StudentSection'; // StudentSectionをインポート

export default function HomePage() {
  const m2Students: string[] = ["M2-A", "M2-B", "M2-C"];
  const m1Students: string[] = ["M1-A", "M1-B", "M1-C"];
  const b4Students: string[] = ["B4-A", "B4-B", "B4-C"];

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-chakra-ui)</title>
      </Head>
      <Container minHeight="100vh">
        <DarkModeSwitch />
        <StudentSection title="M2" studentNames={m2Students} />
        <StudentSection title="M1" studentNames={m1Students} />
        <StudentSection title="B4" studentNames={b4Students} />
      </Container>
    </React.Fragment>
  )
}
