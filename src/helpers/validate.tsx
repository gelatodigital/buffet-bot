import { ATYPES, TTYPES, USER_WHITELIST } from '../constants/whitelist';
import {
	Token,
	RelevantInputData,
	ConditionOrAction,
	Action,
	TxState
} from '../constants/interfaces';
import { KYBER_TOKEN_LIST, TOKEN_LIST } from '../constants/tokens';

import {
	DEFAULT_DATA_ACTION,
	DEFAULT_DATA_TRIGGER,
	ETH,
	BIG_NUM_ONE,
	BIG_NUM_ZERO,
	TOKEN_TRANSFER_CEILING,
	INPUT_ERROR,
	INPUT_OK
} from '../constants/constants';
import { utils, ethers } from 'ethers';
import {
	Params,
	ActionWhitelistData,
	ConditionWhitelistData,
	InputType,
	ChainIds
} from '../constants/interfaces';
import { Web3ReactContextInterface } from '@web3-react/core/dist/types';
import {
	convertWeiToHumanReadableForTokenAmount,
	findConditionById,
	getTokenSymbol,
	getTokenByAddress
} from './helpers';

export const userInputHasError = async (
	label: string,
	userInput: string | number | ethers.utils.BigNumber | boolean,
	inputType: InputType,
	relevantInputData: RelevantInputData,
	state: ConditionWhitelistData | ActionWhitelistData,
	web3: Web3ReactContextInterface<any>,
	conditionOrAction: ConditionOrAction
) => {
	switch (inputType) {
		case InputType.Address:
			try {
				ethers.utils.getAddress(userInput as string);
				return [false, ''];
			} catch (error) {
				return [
					true,
					`Input field '${label}' has to be a correct Ethereum address`
				];
			}
		case InputType.TokenAmount: {
			let networkId = web3.chainId as ChainIds;
			let tokenAddress = state.userInputs[state.approveIndex] as string;
			let token = getTokenByAddress(
				tokenAddress,
				networkId,
				relevantInputData
			);

			// 1. Check if value is correct decimal wise
			const bigBumInput = userInput as ethers.utils.BigNumber;
			if (bigBumInput.gte(ethers.constants.MaxUint256)) {
				// has error

				return [
					true,
					`${token.symbol} can only have ${token.decimals} decimals`
				];
			}
			// 2. Check if is is below DAi Celining
			else {
				// Only validate DAI celing for Actions
				if (conditionOrAction === ConditionOrAction.Action) {
					const result = await validateLimitAmount(
						userInput as ethers.utils.BigNumber,
						token,
						web3.library,
						networkId,
						relevantInputData
					);

					return result;
				} else {
					return [false, ''];
				}
			}
		}
		case InputType.Number: {
			let networkId = web3.chainId as ChainIds;
			let tokenAddress = state.userInputs[state.approveIndex] as string;
			let token = getTokenByAddress(
				tokenAddress,
				networkId,
				relevantInputData
			);

			// 1. Check if value is correct decimal wise
			const bigBumInput = userInput as ethers.utils.BigNumber;
			if (bigBumInput.gte(ethers.constants.MaxUint256)) {
				// has error

				return [
					true,
					`${token.symbol} can only have ${token.decimals} decimals`
				];
			}
		}
		default:
			return [false, ''];
	}
};

export const validateLimitAmount = async (
	srcAmount: ethers.utils.BigNumber,
	token: Token,
	library: any,
	networkId: ChainIds,
	relevantInputData: RelevantInputData
) => {
	if (srcAmount === ethers.constants.Zero) return [false, ''];
	// IF user is whitelisted, skip
	// Get Kyber Price Condition
	const signer = library.getSigner();

	let daiAddress = '';
	if (networkId === 1) {
		daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
	} else if (networkId === 42) {
		daiAddress = '0xC4375B7De8af5a38a93548eb8453a498222C4fF2';
	}

	if (relevantInputData === RelevantInputData.fulcrumTokenList) {
		// Instantiate pToken Contract
		const pTokenAbi =
			'function tokenPrice() external view returns (uint256 price)';

		const pTokenContract = new ethers.Contract(
			token.address[networkId] as string,
			[pTokenAbi],
			signer
		);

		// Get the price of one pToken denominated in the underylint
		// Note: For short tokens, this would be DAI
		// For Long Tokens, this is whatever the underyling is, e.g. dETH Long 2x == ETH
		// In case of Long Token, we need to also convert the e.g. ETH value into DAI price
		try {
			const underlyingValuePerPtoken = await pTokenContract.tokenPrice();
			// console.log(tokenPrice);
			let valueToBeComparedWithDai = underlyingValuePerPtoken;
			// IF token is a short sell token, price will be already in DAI denominated
			const underlyingPerPtoken = convertWeiToHumanReadableForTokenAmount(
				valueToBeComparedWithDai,
				token.decimals
			);
			// console.log(underlyingPerPtoken);

			if (token.name.includes('Long')) {
				// console.log('Long Token');
				// IF token is long token, make additional getExpectedRate call with Kyber
				const condition = findConditionById('3');
				const conditionContract = new ethers.Contract(
					condition.address[networkId],
					[condition.getConditionValueAbi],
					signer
				);

				// @ DEV Change later when introducing more underylings
				const underylingAddress = ETH.address[1];

				const inputsForPrice = [
					underylingAddress,
					BIG_NUM_ONE,
					daiAddress,
					BIG_NUM_ZERO,
					false
				];
				const kyberPrice = await conditionContract.getConditionValue(
					...inputsForPrice
				);
				// console.log(kyberPrice);
				const ethPriceInDai = convertWeiToHumanReadableForTokenAmount(
					kyberPrice,
					18
				);
				// console.log(ethPriceInDai);
				const howMuchPTokenIfLongIsWorthInDay =
					parseFloat(ethPriceInDai) * parseFloat(underlyingPerPtoken);

				// Multiply the amount of underyling we receive per pToken by the amount of DAI we would get for that underyling
				valueToBeComparedWithDai = kyberPrice
					.div(ethers.constants.WeiPerEther)
					.mul(valueToBeComparedWithDai);

				const totalDollarAmountUserWantsToTransfer = valueToBeComparedWithDai
					.mul(srcAmount)
					.div(ethers.constants.WeiPerEther);

				const result = compareUserInputToDaiMax(
					totalDollarAmountUserWantsToTransfer,
					valueToBeComparedWithDai,
					token.address[networkId],
					networkId,
					relevantInputData
				);

				return result;
			} else {
				const totalDollarAmountUserWantsToTransfer = valueToBeComparedWithDai
					.mul(srcAmount)
					.div(ethers.constants.WeiPerEther);

				const result = compareUserInputToDaiMax(
					totalDollarAmountUserWantsToTransfer,
					valueToBeComparedWithDai,
					token.address[networkId],
					networkId,
					relevantInputData
				);

				return result;
			}

			// console.log(humanReadableDollarPrice);
		} catch (error) {
			const result = setDefaultAmountRestriction(
				token,
				srcAmount,
				networkId,
				relevantInputData
			);

			return result;
			// Set default amount restriction
		}
	} else if (relevantInputData === RelevantInputData.kyberTokenList) {
		const condition = findConditionById('3');
		const conditionContract = new ethers.Contract(
			condition.address[networkId],
			[condition.getConditionValueAbi],
			signer
		);

		const sellToken = token.address[networkId];
		if (sellToken === daiAddress) {
			const price = ethers.constants.WeiPerEther;
			const totalTransferVolume = price
				.mul(srcAmount)
				.div(ethers.constants.WeiPerEther);

			const result = compareUserInputToDaiMax(
				totalTransferVolume,
				price,
				sellToken,
				networkId,
				relevantInputData
			);

			return result;
		} else {
			const inputsForPrice = [
				sellToken,
				BIG_NUM_ONE,
				daiAddress,
				BIG_NUM_ZERO,
				false
			];
			// get value
			// getConditionValue(address _src, uint256 _srcAmount, address _dest, uint256, bool)
			try {
				const kyberPrice = await conditionContract.getConditionValue(
					...inputsForPrice
				);
				const totalTransferVolume = kyberPrice
					.mul(srcAmount)
					.div(ethers.constants.WeiPerEther);
				const result = compareUserInputToDaiMax(
					totalTransferVolume,
					kyberPrice,
					token.address[networkId],
					networkId,
					relevantInputData
				);

				return result;
				// convert Value into human readable form
			} catch (error) {
				// console.log(error);
				const result = setDefaultAmountRestriction(
					token,
					srcAmount,
					networkId,
					relevantInputData
				);

				return result;
			}
		}
	}
};

const compareUserInputToDaiMax = (
	valueToBeComparedWithDaiCeiling: ethers.utils.BigNumber,
	exchangeRate: ethers.utils.BigNumber,
	sellTokenAddress: string,
	networkId: ChainIds,
	relevantInputData: RelevantInputData
) => {
	// If the total Transfer volume is greater than the Token Transfer Ceiling, spit out error for unwhitelisted users and no error for whitelisted users
	if (TOKEN_TRANSFER_CEILING.lt(valueToBeComparedWithDaiCeiling)) {
		// console.log(TOKEN_TRANSFER_CEILING.toString());
		// console.log('Is smaller than');
		// console.log(totalTransferVolume.toString());
		const ceilingBN = TOKEN_TRANSFER_CEILING.mul(
			ethers.utils.bigNumberify('100000')
		).div(exchangeRate);
		// console.log(ceilingBN);
		// console.log(ceilingBN.toString());
		const ceilingFloat = parseFloat(ceilingBN.toString()) / 100000;
		// .mul(ethers.utils.bigNumberify('100'))
		// const ceilingFloat = (
		// 	parseFloat(ceilingBN.toString()) / 100
		// ).toFixed(3);
		// console.log('Setting error to TRUE');

		return [
			true,
			`This alpha is restricted to move ${ceilingFloat} ${getTokenSymbol(
				sellTokenAddress,
				networkId,
				relevantInputData
			)} max. To gain a higher allowance, please contact us!`
		];
	} else {
		// console.log('Not in Err err');
		// console.log('Ceiling');
		// console.log(TOKEN_TRANSFER_CEILING.toString());
		// console.log('Total Amount');
		// console.log(totalTransferVolume.toString());
		return [false, ``];
	}
};

const setDefaultAmountRestriction = (
	token: Token,
	sellAmount: ethers.utils.BigNumber,
	networkId: ChainIds,
	relevantInputData: RelevantInputData
) => {
	// Need to do number mambo Jambo due to big numbers not accepting decimal values
	const inflationConstant = '10000000000';
	const tokenMaxFloat = parseFloat(token.max);
	const tokenMaxInflated = tokenMaxFloat * parseFloat(inflationConstant);

	const hardcap = ethers.utils
		.bigNumberify(tokenMaxInflated.toString())
		.mul(ethers.constants.WeiPerEther);

	const inflatedSellVolume = sellAmount.mul(
		ethers.utils.bigNumberify(inflationConstant)
	);
	// If sell amount is greater than ceiling => ERROR
	if (inflatedSellVolume.gt(hardcap)) {
		console.log('Setting error true in static Validation');
		// Error

		return [
			true,
			`This alpha is restricted to move ${token.max} ${getTokenSymbol(
				token.address[networkId] as string,
				networkId,
				relevantInputData
			)} max. To gain a higher allowance, please contact us!`
		];
	} else {
		console.log('Setting error false in static Validation');
		// All good
		return [false, ''];
	}
};