import {
	InputType,
	ChainIds,
	RelevantInputData,
	ConditionOrAction
} from './interfaces';
import { ethers } from 'ethers';
import {
	getTokenByAddress,
	convertWeiToHumanReadableForTokenAmount,
	convertWeiToHumanReadableForNumbersAndGetValue
} from '../helpers/helpers';
import { timestampToDate } from '../components/Inputs/DatePicker';

export const getConditionText = (
	inputs: Array<string | number | boolean | ethers.utils.BigNumber>,
	id: number,
	networkId: ChainIds,
	relevantInputData: RelevantInputData
): string => {
	switch (id) {
		// Token balance
		case 1:
			return `If the ${
				getTokenByAddress(
					inputs[1] as string,
					networkId,
					relevantInputData
				).symbol
			} balance of address ${inputs[0]} ${
				inputs[3] ? 'is higher or equal to' : 'is lower or equal to'
			} ${convertWeiToHumanReadableForTokenAmount(
				inputs[2] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[1] as string,
					networkId,
					relevantInputData
				).decimals
			)} ${
				getTokenByAddress(
					inputs[1] as string,
					networkId,
					relevantInputData
				).symbol
			}`;
		// Price on Kyber
		/*
            'Sell Token',
			'Sell Volume',
			'Buy Token',
			'Price activating condition',
			'',

        */

		case 2:
			const sellAmount = convertWeiToHumanReadableForTokenAmount(
				inputs[1] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).decimals
			);
			const price = convertWeiToHumanReadableForNumbersAndGetValue(
				inputs[3] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[2] as string,
					networkId,
					relevantInputData
				),
				ConditionOrAction.Condition,
				id
			);

			const expectedBuyAmount =
				parseFloat(sellAmount) * parseFloat(price);

			const isOrAre = parseFloat(sellAmount) === 1.0;
			console.log(isOrAre);

			const buySymbol = getTokenByAddress(
				inputs[0] as string,
				networkId,
				relevantInputData
			).symbol;

			const sellSymbol = getTokenByAddress(
				inputs[2] as string,
				networkId,
				relevantInputData
			).symbol;

			const exchangeRate = `(1 ${buySymbol} = ${price} ${sellSymbol})`;

			return `If ${sellAmount} ${buySymbol} ${
				isOrAre ? 'is' : 'are'
			} worth ${expectedBuyAmount} ${sellSymbol} ${
				isOrAre ? '' : exchangeRate
			} on Kyber `;
		case 3:
			return `When the following date has been reached: ${timestampToDate(
				inputs[0] as number
			)} `;
		default:
			return '';
	}
};

export const getActionText = (
	inputs: Array<string | number | boolean | ethers.utils.BigNumber>,
	id: number,
	networkId: ChainIds,
	relevantInputData: RelevantInputData
): string => {
	switch (id) {
		// Send Tokens
		case 1:
			return `Then your gelato bot will send ${convertWeiToHumanReadableForTokenAmount(
				inputs[1] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).decimals
			)} ${
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).symbol
			} to address ${inputs[2]}`;
		// Trade Tokens on Kyber
		case 2:
			return `Then your gelato bot will sell ${convertWeiToHumanReadableForTokenAmount(
				inputs[1] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).decimals
			)} ${
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).symbol
			} for ${
				getTokenByAddress(
					inputs[2] as string,
					networkId,
					relevantInputData
				).symbol
			} on Kyber`;
		// Buy Leverage Tokens on Fulcrum
		case 3:
			return `Then your gelato bot will sell ${convertWeiToHumanReadableForTokenAmount(
				inputs[1] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).decimals
			)} ${
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).symbol
			} for ${
				getTokenByAddress(
					inputs[2] as string,
					networkId,
					relevantInputData
				).symbol
			} (${
				getTokenByAddress(
					inputs[2] as string,
					networkId,
					relevantInputData
				).name
			}) tokens on Fulcrum`;
		// Sell Leverage Tokens on Fulcrum
		case 4:
			return `Then your gelato bot will sell ${convertWeiToHumanReadableForTokenAmount(
				inputs[1] as ethers.utils.BigNumber,
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).decimals
			)} ${
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).symbol
			} (${
				getTokenByAddress(
					inputs[0] as string,
					networkId,
					relevantInputData
				).name
			}) tokens for ${
				getTokenByAddress(
					inputs[2] as string,
					networkId,
					relevantInputData
				).symbol
			} on Fulcrum`;

		default:
			return '';
	}
};

export const getStatusText = (status: string) => {
	switch (status) {
		case 'open':
			return 'open';
			break;
		case 'executedSuccess':
			return 'succesfully executed';
			break;
		case 'executedFailure':
			return 'failed to execute - please contact us';
			break;
		case 'cancelled':
			return 'cancelled';
			break;
		case 'expired':
			return 'expired';
			break;
		default:
			return 'error';
	}
};
