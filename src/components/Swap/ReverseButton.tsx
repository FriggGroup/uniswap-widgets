import { useSwitchSwapCurrencies } from 'hooks/swap'
import { ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon, ArrowUpDown } from 'icons'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import { Layer } from 'theme'

import Button from '../Button'
import Row from '../Row'

const ReverseRow = styled(Row)`
  left: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: ${Layer.OVERLAY};
`

const ArrowUp = styled(ArrowUpIcon)`
  left: calc(50% - 0.37em);
  position: absolute;
  top: calc(50% - 0.82em);
`

const ArrowDown = styled(ArrowDownIcon)`
  bottom: calc(50% - 0.82em);
  position: absolute;
  right: calc(50% - 0.37em);
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const StyledReverseButton = styled(Button)<{ turns: number }>`
  background-color: rgb(113, 188, 146) !important;
  border-radius: 25px;
  color: rgb(255, 255, 255);
  height: 3em;
  position: relative;
  width: 3em;

  div {
    transform: rotate(${({ turns }) => turns / 2}turn);
    transition: transform 0.25s ease-in-out;
    will-change: transform;
  }
`

export default function ReverseButton({ disabled }: { disabled?: boolean }) {
  const [turns, setTurns] = useState(0)
  const switchCurrencies = useSwitchSwapCurrencies()
  const onClick = useCallback(() => {
    switchCurrencies()
    setTurns((turns) => ++turns)
  }, [switchCurrencies])

  return (
    <ReverseRow justify="center">
      <Overlay>
        <StyledReverseButton disabled={disabled} onClick={onClick} turns={turns}>
          <div>
            <ArrowUpDown strokeWidth={3} />
          </div>
        </StyledReverseButton>
      </Overlay>
    </ReverseRow>
  )
}
