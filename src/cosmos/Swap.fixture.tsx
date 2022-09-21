import { tokens } from '@uniswap/default-token-list'
import { TokenInfo } from '@uniswap/token-lists'
import {
  darkTheme,
  DEFAULT_LOCALE,
  defaultTheme,
  lightTheme,
  SUPPORTED_LOCALES,
  SupportedChainId,
  SwapWidget,
} from '@uniswap/widgets'
import { CHAIN_NAMES_TO_IDS, ChainName } from 'constants/chains'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'
import { Field } from 'state/swap'

import { MarketType } from '../components/Swap'
import { DAI, USDC_MAINNET } from '../constants/tokens'
import useOption from './useOption'
import useProvider, { INFURA_NETWORK_URLS } from './useProvider'

function Fixture() {
  const [convenienceFee] = useValue('convenienceFee', { defaultValue: 0 })
  const convenienceFeeRecipient = useOption('convenienceFeeRecipient', {
    options: [
      '0x1D9Cd50Dde9C19073B81303b3d930444d11552f7',
      '0x0dA5533d5a9aA08c1792Ef2B6a7444E149cCB0AD',
      '0xE6abE059E5e929fd17bef158902E73f0FEaCD68c',
    ],
  })

  // TODO(zzmp): Changing defaults has no effect if done after the first render.
  const currencies: Record<string, string> = {
    Native: 'NATIVE',
    DAI: DAI.address,
    USDC_Mainnet: USDC_MAINNET.address,
    USDC_Goerli: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    ATT: '0x25a1dAd9d882c335D100f8E0cb20701376Eeb658',
    BTT: '0x85d36Ab8F67533806eFA80982d8A0A6BF8188a98',
    CTT: '0x615a28d4367322756400593171CeebA69773303b',
    DTT: '0x0f710556B75091Fb7D54595AE87fBE5d133a197e',
  }
  const defaultInputToken = useOption('defaultInputToken', {
    options: currencies,
    // TODO we need to change the default tokens here (see todo comment above)
    defaultValue: 'USDC_Goerli',
  })
  const [defaultInputAmount] = useValue('defaultInputAmount', { defaultValue: 1 })
  const defaultOutputToken = useOption('defaultOutputToken', {
    options: currencies,
    // TODO we need to change the default tokens here (see todo comment above)
    defaultValue: 'ATT',
  })
  const [defaultOutputAmount] = useValue('defaultOutputAmount', { defaultValue: 0 })

  const [hideConnectionUI] = useValue('hideConnectionUI', { defaultValue: false })

  const [width] = useValue('width', { defaultValue: 360 })

  const locales = [...SUPPORTED_LOCALES, 'fa-KE (unsupported)', 'pseudo']
  const locale = useOption('locale', { options: locales, defaultValue: DEFAULT_LOCALE, nullable: false })

  const [theme, setTheme] = useValue('theme', { defaultValue: { ...defaultTheme } })
  const [darkMode] = useValue('darkMode', { defaultValue: false })
  useEffect(() => setTheme((theme) => ({ ...theme, ...(darkMode ? darkTheme : lightTheme) })), [darkMode, setTheme])

  const jsonRpcUrlMap = INFURA_NETWORK_URLS

  const defaultNetwork = useOption('defaultChainId', {
    options: Object.keys(CHAIN_NAMES_TO_IDS),
    defaultValue: ChainName.GOERLI,
  })
  const defaultChainId = defaultNetwork ? CHAIN_NAMES_TO_IDS[defaultNetwork] : undefined

  const connector = useProvider(defaultChainId)

  const friggTokens = [
    {
      name: 'ATT',
      address: '0x25a1dAd9d882c335D100f8E0cb20701376Eeb658',
      symbol: 'ATT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'BTT',
      address: '0x85d36Ab8F67533806eFA80982d8A0A6BF8188a98',
      symbol: 'BTT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'CTT',
      address: '0x615a28d4367322756400593171CeebA69773303b',
      symbol: 'CTT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'DTT',
      address: '0x0f710556B75091Fb7D54595AE87fBE5d133a197e',
      symbol: 'DTT',
      decimals: 18,
      chainId: 1,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    // we can keep every token from every network in the list. the list is filtered by chainId during runtime
    {
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
      chainId: 1,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
    {
      name: 'USD Coin',
      address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
      symbol: 'USDC',
      decimals: 6,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
  ]

  const tokenLists: Record<string, TokenInfo[]> = {
    'Mainnet only': tokens.filter((token) => token.chainId === SupportedChainId.MAINNET),
    'Frigg tokens': friggTokens,
  }
  const tokenList = useOption('tokenList', { options: tokenLists, defaultValue: 'Frigg tokens', nullable: false })
  console.log(tokenList)

  const marketTypes: Record<string, MarketType> = {
    buy: 'buy',
    swap: 'swap',
    sell: 'sell',
  }
  const marketType = useOption('marketType', { options: marketTypes, defaultValue: 'buy', nullable: false })
  const [routerUrl] = useValue('routerUrl', { defaultValue: 'https://api.uniswap.org/v1/' })

  return (
    <SwapWidget
      convenienceFee={convenienceFee}
      convenienceFeeRecipient={convenienceFeeRecipient}
      defaultInputTokenAddress={defaultInputToken}
      defaultInputAmount={defaultInputAmount}
      defaultOutputTokenAddress={defaultOutputToken}
      defaultOutputAmount={defaultOutputAmount}
      hideConnectionUI={hideConnectionUI}
      locale={locale}
      jsonRpcUrlMap={jsonRpcUrlMap}
      defaultChainId={defaultChainId}
      provider={connector}
      theme={theme}
      tokenList={tokenList}
      width={width}
      routerUrl={routerUrl}
      onConnectWalletClick={() =>
        new Promise((resolve) => {
          console.log('integrator provided a onConnectWalletClick')
          resolve(true) // to open our built-in wallet connect flow
        })
      }
      onReviewSwapClick={() => new Promise((resolve) => resolve(true))}
      onTokenSelectorClick={(f: Field) =>
        new Promise((resolve) => {
          console.log('onTokenSelectorClick', f)
          resolve(true)
        })
      }
      onTxSubmit={(txHash: string, data: any) => console.log('tx submitted:', txHash, data)}
      onTxSuccess={(txHash: string, data: any) => console.log('tx success:', txHash, data)}
      onTxFail={(error: Error, data: any) => console.log('tx fail:', error, data)}
      marketType={marketType}
      closeDialogWidget={() => console.log('closeDialogWidget')} // this handler is included as a test of functionality, but only logs
      queryFee={2400000000000000} // Query Fee is used for quadrata passport check
    />
  )
}

export default <Fixture />
