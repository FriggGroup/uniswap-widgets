import { ArrowDown as ArrowDownIcon } from 'icons'
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

const ArrowDown = styled(ArrowDownIcon)`
  bottom: calc(50% - 0.7em);
  position: absolute;
  right: calc(50% - 0.5em);
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const StyledReverseButton = styled(Button)`
  background-color: rgb(113, 188, 146) !important;
  border-radius: 25px;
  color: rgb(255, 255, 255);
  height: 3em;
  position: relative;
  width: 3em;

  :enabled:hover {
    pointer-events: none;
  }
`

export default function SwapArrow() {
  return (
    <ReverseRow justify="center">
      <Overlay>
        <StyledReverseButton>
          <div>
            <ArrowDown strokeWidth={3} />
          </div>
        </StyledReverseButton>
      </Overlay>
    </ReverseRow>
  )
}
