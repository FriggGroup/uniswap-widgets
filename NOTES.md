# uniswap-widgets logic changes in the fork

## Where do i find ... ?

- The swap logic and components which are shared between swap and buy/sell functionality
  - src/hooks/swap
  - src/components/Swap
    
- The buy/sell logic
  - src/hooks/buy: all files were copied from the hooks/swap folder and adjusted for buy/sell logic
  - src/components/Swap/Buy... : all files were copied Swap components and adjusted for buy/sell logic
    
- The fetch price logic
  - for a swap: useSwapInfo() -> useRouterTrade() -> useClientSideSmartOrderRouterTrade() OR useClientSideV3Trade()
  -> useSingleContractWithCallData(quoteCallParameters())
  - for a buy or sell: investmentTrade = useBuySellInfo() -> useInvestment() -> useClientSideInvestment() -> 
    useSingleContractWithCallData(FriggRouterContract.encodeFunctionData('tokenData'))

- The approve frigg router logic: BuyButton -> useApprovalData(investmentTrade) -> handleApproveOrPermit() -> useSwapApproval()
-> useSwapRouterAddress()
  
- The buy/sell send transaction logic: BuyButton -> useBuySellCallback(investmentTrade) -> useBuySellCallArguments
&& useSendSwapTransaction()

## Local Dev Environment 
Cosmos is the widget framework. `yarn start` runs the `cosmos` command. everything in `src/cosmos` is related to the 
local dev environment.

- src/cosmos/Swap.fixture.tsx: changed the tokenlist and the defaultTokenAddresses in there. and also the default
JsonRpcProvdier
  
## Added files
Since they are added new, no conflicts will occur here. If you see changes in the corresponding swap components, it may make
sense to change them here too.

- all files in src/hooks/buy
- all files in src/components/Swap which start with "Buy"

## Changed files

These are shared files between swap and buy/sell functionality. Here the chances for conflicts are higher.

### src/constants
- added the Frigg Router Address to src/constants/addresses.ts

### src/hooks
- src/hooks/swap/useSendSwapTransaction.tsx: only type change to fix tsc error
- src/hooks/swap/useSwapApproval.ts: this hook is a shared hook for swap and buy/sell functionality. adjusted the types 
  with the InvestmentTrade type from buy/sell and making sure that the frigg router address is used when we are in buy/sell
- src/hooks/useActiveWeb3React.tsx: a small change which fixes the bug that the library keeps the mainnet chainId when
switching the network
  
### src/state
- src/state/transactions.ts: added TransactionType.BUY and TransactionType.SELL

### src/components

- Passing a _fixed_ property to some shared components to use it for the buy/sell functionality. if fixed than we dont
  dont let the user choose tokens or change input to output token by clicking the middle button
  - src/components/Swap/Output.tsx
  - src/components/TokenSelect/TokenButton.tsx
  - src/components/TokenSelect/index.tsx
    

- Fixing typescript errors by adding InvestmentTrade as trade type
  - src/components/Swap/Price.tsx
  - src/components/Swap/SwapButton/useApprovalData.tsx
    




# uniswap-widgets UI / Design changes in the fork (Question 5)

- src/components/Swap/SwapArrow.tsx (styles for the swap arrow icon)
- src/theme/index.tsx (default values for the style theme) 
- src/components/Swap/BuyButton/index.tsx (buy button text) 
- src/components/Widget.tsx (removed fixed width and height following Sergio comments, added styles and fonts, added here the dynamic text props, changed text display)
- src/components/Swap/ReverseButton.tsx (arrow up & down styles for the icon)


# Question 6
Und Punkt #6 weiss auch nicht, also grundsätzlich wenn sie etwas in die widget angepasst haben, zuerst in testet alles nochmals testen und dann sollte okay sein. Aber der code ist loosly coupled, es gibt keine starke dependencies file x, file y…





# Charts
_in frigg-demo repository_

## How to get the charts:
https://github.com/FriggGroup/friggdemo/blob/feature/widgets/chart.sh

## The Chart Library:
https://www.chartjs.org/

https://www.chartjs.org/docs/latest/

## Chartjs with React:
https://react-chartjs-2.js.org/

https://react-chartjs-2.js.org/examples/multitype-chart