import React, { useEffect } from 'react';
import NumberFormat from 'react-number-format';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import { INPUT_CSS, UPDATE_GET_VALUE_INPUT } from '../../constants/constants';
import {
	InputType,
	TriggerWhitelistData,
	TriggerOrAction
} from '../../constants/interfaces';
import { ethers } from 'ethers';
import {
	getTokenByAddress,
	convertWeiToHumanReadable
} from '../../helpers/helpers';
import { useIcedTxContext } from '../../state/GlobalState';
import { Zero } from 'ethers/constants';

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		...INPUT_CSS
	})
);

interface NumberFormatCustomProps {
	inputRef: (instance: NumberFormat | null) => void;
	onChange: (event: { target: { value: string } }) => void;
}

function NumberFormatCustom(props: NumberFormatCustomProps) {
	const { inputRef, onChange, ...other } = props;

	return (
		<NumberFormat
			{...other}
			getInputRef={inputRef}
			onValueChange={values => {
				onChange({
					target: {
						value: values.value
					}
				});
			}}
			allowNegative={false}
			thousandSeparator
			isNumericString
			fixedDecimalScale={true}
			// prefix="$"
		/>
	);
}

interface State {
	textmask: string;
	numberformat: string;
}

interface ReactNumberFormatProps {
	label: string;
	index: number;
	updateUserInput: Function;
	inputType: InputType;
	inputs: Array<string | number | ethers.utils.BigNumber | boolean>;
	defaultValue: ethers.utils.BigNumber;
	convertToWei: boolean;
	disabled: boolean;
	tokenIndex: number;
	triggerOrAction: TriggerOrAction;
}

export default function ReactNumberFormat(props: ReactNumberFormatProps) {
	const {
		label,
		updateUserInput,
		index,
		inputType,
		inputs,
		defaultValue,
		convertToWei,
		disabled,
		tokenIndex,
		triggerOrAction
	} = props;
	const classes = useStyles();

	// Convert defaultValue into human readable version

	// @DEV Check if that works with eth

	// const humanFriendlyAmount = ethers.utils.formatUnits(
	// 	defaultValue,
	// 	token.decimals
	// );

	const [values, setValues] = React.useState<State>({
		textmask: '(1  )    -    ',
		numberformat: defaultValue.eq(Zero)
			? '0'
			: convertWeiToHumanReadable(
					defaultValue,
					getTokenByAddress(inputs[tokenIndex].toString())
			  )
	});

	const { dispatch, icedTxState } = useIcedTxContext();

	// ONLY FOR StatelessGetValue
	useEffect(() => {
		// If inputs are disabled, and we make an async request to fetch some value for getValue, run this useEffect to update the state
		// Only call function when 1) we deal with Stateless getvalue type

		if (inputs[0] !== undefined) {
			if (inputType === InputType.StatelessGetValue) {
				// handleNewValue(defaultValue.toString());
				const tokenAddress = inputs[tokenIndex].toString();
				// Find token object by address
				let token = getTokenByAddress(tokenAddress);
				const humanReadableAmount = convertWeiToHumanReadable(
					defaultValue,
					token
				);

				// Set state for all
				setValues({
					...values,
					numberformat: humanReadableAmount
				});
				dispatch({
					type: UPDATE_GET_VALUE_INPUT,
					newGetValueInput: defaultValue
				});
			}
		}
	}, [defaultValue]);

	// We always store the WEI amount in global state, but in local state we store the userFriendly version
	const handleNewValue = (newValue: string) => {
		if (newValue !== '' && newValue !== '.') {
			// setValues({
			// 	...values,
			// 	numberformat: newValue
			// });
			const tokenAddress = inputs[tokenIndex].toString();
			// Find token object by address
			let token = getTokenByAddress(tokenAddress);

			// Handle special case if InputType is TokenAmount
			if (inputType === InputType.TokenAmount) {
				// get index of token in question
				// @DEV Assuming that token in question always comes one index before tokenAmount
				// @DEV change to approval amount

				const weiAmount = ethers.utils.parseUnits(
					newValue,
					token.decimals
				);
				// console.log(weiAmount.toString());
				// Update global state
				// If we need to convert the input from userfriendly amount to WEi amount, take the converted amount, else take the original
				convertToWei
					? updateUserInput(index, weiAmount)
					: updateUserInput(index, newValue);
			} else if (inputType === InputType.Number) {
				updateUserInput(index, newValue);
			}
			// Set state for all
			setValues({
				...values,
				numberformat: newValue
			});

			// ######### End of big IF
		} else if (newValue === '.') {
			setValues({
				...values,
				numberformat: '0.'
			});
			const zero = ethers.constants.Zero;

			updateUserInput(index, zero);
		} else if (newValue === '') {
			setValues({
				...values,
				numberformat: ''
			});
			const zero = ethers.constants.Zero;

			updateUserInput(index, zero);
		} else {
			throw Error('Input value is empty / wrong');
		}
	};

	const handleChange = (name: keyof State) => (
		event: React.ChangeEvent<{ value: unknown }>
	) => {
		// updateUser Input
		const newValue = event.target.value as string;
		handleNewValue(newValue);
	};

	return (
		<TextField
			className={classes.root}
			label={label}
			value={values.numberformat}
			onChange={handleChange('numberformat')}
			id="formatted-numberformat-input"
			InputProps={{
				inputComponent: NumberFormatCustom as any
			}}
			InputLabelProps={{
				shrink: true
			}}
			variant="outlined"
			key={`num-"${index}`}
			disabled={disabled}
		/>
	);
}
