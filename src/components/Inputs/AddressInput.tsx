import React from 'react';
import TextField from '@material-ui/core/TextField';
import {
	InputType,
	TriggerOrAction,
	ActionWhitelistData,
	TriggerWhitelistData,
	TxState
} from '../../constants/interfaces';

import { useIcedTxContext } from '../../state/GlobalState';
import { INPUT_ERROR, INPUT_OK } from '../../constants/constants';
import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';

interface AddressInputProps {
	inputType: InputType;
	label: string;
	index: number;
	triggerOrAction: TriggerOrAction;
	inputs: Array<string | number | ethers.utils.BigNumber | boolean>;
	app: string;
	disabled: boolean;
	trigger?: TriggerWhitelistData;
	action?: ActionWhitelistData;
	approveIndex: number;
	updateUserInput: Function;
	classes: Record<'form' | 'root', string>;
}

export default function AddressInput(props: AddressInputProps) {
	// Props
	const {
		app,
		inputType,
		label,
		index,
		triggerOrAction,
		inputs,
		disabled,
		trigger,
		action,
		approveIndex,
		updateUserInput,
		classes
	} = props;
	// Context

	// Error Bool, default false
	// Applied to:
	// // Address
	const [error, setError] = React.useState(false);

	const { active, account, library } = useWeb3React();

	const { dispatch, icedTxState } = useIcedTxContext();

	// At first render, check validity of input
	// useEffect(() => {
	// 	validateAddressInput('0x0');
	// }, []);

	const returnDefaultString = (): string => {
		// FETCH FROM STATE
		if (inputs[0] !== undefined) {
			if (inputs[index] !== undefined) {
				return inputs[index] as string;
			}
			// Else, Use default value
			else {
				return getDefaultStringValue();
			}
		} else {
			return getDefaultStringValue();
		}
	};

	const getDefaultStringValue = () => {
		let defaultAddress: string;
		if (account) {
			defaultAddress = account;
		} else {
			defaultAddress = '0x0';
		}
		updateUserInput(index, defaultAddress);
		validateAddressInput(defaultAddress);
		return defaultAddress;
	};

	// Used to validate address

	const handleAddressChange = (event: React.ChangeEvent<{ value: any }>) => {
		const newAddress = event.target.value as string;
		validateAddressInput(newAddress);
		updateUserInput(index, newAddress);
	};

	const validateAddressInput = (newAddress: string) => {
		// Validate address
		try {
			ethers.utils.getAddress(newAddress);
			if (error) {
				setError(false);
			}
			if (icedTxState.error.isError) {
				console.log('Address Correct');
				dispatch({
					type: INPUT_OK,
					txState: TxState.displayInstallMetamask
				});
			}
		} catch (error) {
			if (!error) {
				setError(true);
			}
			if (!icedTxState.error.isError) {
				console.log('Error');
				console.log(icedTxState.txState);
				dispatch({
					type: INPUT_ERROR,
					msg: `Input field '${label}' hat to be a correct Ethereum address`,
					txState: TxState.inputError
				});
			}
		}
	};

	return (
		<TextField
			className={classes.root}
			required
			style={{ marginTop: '0px', marginBottom: '0px' }}
			id={`address-input-${disabled}-${triggerOrAction}-${index}`}
			label={label}
			defaultValue={returnDefaultString()}
			onChange={handleAddressChange}
			error={error}
			key={`address-input-${disabled}-${triggerOrAction}-${index}`}
			// helperText="Full width!"
			// Import TextField CSS
			margin="normal"
			InputLabelProps={{
				shrink: true
			}}
			variant="outlined"
			disabled={disabled}
		/>
	);
	// Import TextField CSS
}