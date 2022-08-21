import { useSwitchSwapCurrencies } from 'hooks/swap'
import { ArrowUpDown } from 'icons'
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

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const StyledReverseButton = styled(Button)<{ turns: number }>`
  background-color: ${({ theme }) => theme.accent};
  border-radius: 2em;
  color: ${({ theme }) => theme.onAccent};
  height: 3em;
  position: relative;
  width: 3em;

  :enabled:hover {
    background-color: ${({ theme }) => theme.onHover(theme.accent)};
  }

  div {
    transform: rotate(${({ turns }) => turns / 2}turn);
    transition: transform 0.25s ease-in-out;
    will-change: transform;

    svg {
      display: block;
      margin: auto;
    }
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
