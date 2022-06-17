import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ChevronDown } from 'icons'
import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

import Button from '../Button'
import Row from '../Row'
import TokenImg from '../TokenImg'

const transitionCss = css`
  transition: background-color 0.125s linear, border-color 0.125s linear, filter 0.125s linear, width 0.125s ease-out;
`

const StyledTokenButton = styled(Button)<{ fixed?: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;

  :enabled {
    ${({ transition }) => transition && transitionCss};
  }
`

const TokenButtonRow = styled(Row)<{ empty: boolean; collapsed: boolean; fixed?: boolean }>`
  float: right;
  height: 1.2em;
  // max-width must have an absolute value in order to transition.
  max-width: ${({ collapsed }) => (collapsed ? '1.2em' : '12em')};
  padding-left: ${({ empty }) => empty && 0.5}em;
  width: fit-content;
  overflow: hidden;
  transition: max-width 0.25s linear;

  padding-right: ${({ fixed }) => fixed && 0.2}em;

  img {
    min-width: 1.2em;
  }
`

interface TokenButtonProps {
  value?: Currency
  collapsed: boolean
  disabled?: boolean
  onClick: () => void
  fixed?: boolean
}

export default function TokenButton({ value, collapsed, disabled, onClick, fixed }: TokenButtonProps) {
  const buttonBackgroundColor = useMemo(() => (value || fixed ? 'interactive' : 'accent'), [value])
  const contentColor = useMemo(() => (value || disabled || fixed ? 'onInteractive' : 'onAccent'), [value, disabled])

  // Transition the button only if transitioning from a disabled state.
  // This makes initialization cleaner without adding distracting UX to normal swap flows.
  const [shouldTransition, setShouldTransition] = useState(disabled)
  useEffect(() => {
    if (disabled) {
      setShouldTransition(true)
    }
  }, [disabled])

  // width must have an absolute value in order to transition, so it is taken from the row ref.
  const [row, setRow] = useState<HTMLDivElement | null>(null)
  const style = useMemo(() => {
    if (!shouldTransition) return
    return { width: row ? row.clientWidth + /* padding= */ 8 + /* border= */ 2 : undefined }
  }, [row, shouldTransition])

  return (
    <StyledTokenButton
      onClick={fixed ? undefined : onClick}
      color={buttonBackgroundColor}
      disabled={disabled}
      style={style}
      transition={shouldTransition}
      onTransitionEnd={() => setShouldTransition(false)}
      fixed={fixed}
    >
      <ThemedText.ButtonLarge color={contentColor}>
        <TokenButtonRow
          gap={0.6}
          empty={!value}
          collapsed={collapsed}
          // ref is used to set an absolute width, so it must be reset for each value passed.
          // To force this, value?.symbol is passed as a key.
          ref={setRow}
          key={value?.symbol}
          fixed={fixed}
        >
          {value ? (
            <>
              <TokenImg token={value} size={1.2} />
              {value.symbol}
            </>
          ) : !fixed ? (
            <Trans>Select a token</Trans>
          ) : null}
          {!fixed ? <ChevronDown color={contentColor} strokeWidth={3} /> : <></>}
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
