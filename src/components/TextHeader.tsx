import { ReactNode } from 'react'
import styled from 'styled-components/macro'

import Column from './Column'

const HeaderColumn = styled(Column)`
  margin: 0 0.75em 1.75em;
  padding-top: 0.5em;
`

export interface HeaderProps {
  children: ReactNode
}

export default function TextHeader({ children }: HeaderProps) {
  return (
    <HeaderColumn>
      <Column gap={0.5}>{children}</Column>
    </HeaderColumn>
  )
}
