import React, { MouseEvent, useState, useEffect } from 'react';

// Material UI
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';

// Local Components
import Stepper from '../components/Stepper';
import MobileStepper from '../components/MobileStepper';

// Types
import { RouteComponentProps } from 'react-router-dom';
import { useIcedTxContext } from '../state/GlobalState';
import { StepperProps, ConditionOrAction } from '../constants/interfaces';
import { findCondition, findAction } from '../helpers/helpers';
import { SELECT_CONDITION, SELECT_ACTION } from '../constants/constants';
import TransactionModal from '../components/Modal';

interface Params {
	conditionId: string;
	actionId: string;
}

// interface Match  {
//     params: Params;
// }

// interface Match extends RouteComponentProps<Params> {}

export default function Create({ match }: RouteComponentProps<Params>) {
	const {
		params: { conditionId, actionId }
	} = match;
	const { icedTxState, dispatch } = useIcedTxContext();
	console.log(icedTxState);

	// Returns true if wrong params were inputted in URL
	const [notFound, setNotFound] = useState(false);

	// When component renders, 1) Check that icedTx state exist, if not 2) check if correct params were inputted in URL, if not, 3) setNotFound = true
	useEffect(() => {
		if (icedTxState.condition.id === 0 || icedTxState.action.id === 0) {
			// See if inputted params in URL exist in whitelist
			// console.log(conditionId, actionId)
			const paramCondition = findCondition(conditionId);
			const paramAction = findAction(actionId);
			// console.log(paramCondition)
			// console.log(paramAction)
			if (paramCondition.id === 0 || paramAction.id === 0) {
				// Render IcedTx not found
				setNotFound(true);
			} else {
				// updateIcedTx(
				// 	ConditionOrAction.Condition,
				// 	paramCondition.id.toString()
				// );
				dispatch({
					type: SELECT_CONDITION,
					id: paramCondition.id.toString()
				});
				// updateIcedTx(
				// 	ConditionOrAction.Action,
				// 	paramAction.id.toString()
				// );
				dispatch({
					type: SELECT_ACTION,
					id: paramAction.id.toString()
				});
			}
		}
	}, []);

	// IF ICEDTXSTATE == 0 => Use from query string. If still zero, render Confiugrator

	// Stepper State
	const [activeStep, setActiveStep] = React.useState(0);
	// const steps = getSteps();

	// Stepper Functions
	function handleNext() {
		// @ DEV INCLUDE VALIDATION, ONLY ALLOW IF ALL INPUT FIELDS HAVE BEEN VALIDATED
		setActiveStep(prevActiveStep => prevActiveStep + 1);
	}

	const handleBack = () => {
		setActiveStep(prevActiveStep => prevActiveStep - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
	};

	function getSteps() {
		return ['Set Condition', 'Set Action', 'Create IcedTx'];
	}

	// MODAL STUFF

	// Modal Stuff
	const [modalOpen, setModalOpen] = React.useState(true);

	const modalClickOpen = () => {
		setModalOpen(true);
	};

	const modalClose = () => {
		setModalOpen(false);
	};

	// MODAL STUFF END

	return (
		<React.Fragment>
			<Grid
				container
				direction="row"
				justify="center"
				alignItems="center"
			>
				{!notFound && (
					<React.Fragment>
						<Hidden xsDown>
							<Stepper
								icedTxState={icedTxState}
								steps={getSteps()}
								activeStep={activeStep}
								handleNext={handleNext}
								handleBack={handleBack}
								handleReset={handleReset}
								modalOpen={modalOpen}
								modalClickOpen={modalClickOpen}
								modalClose={modalClose}
							></Stepper>
						</Hidden>
						<Hidden smUp>
							<MobileStepper
								icedTxState={icedTxState}
								steps={getSteps()}
								activeStep={activeStep}
								handleNext={handleNext}
								handleBack={handleBack}
								handleReset={handleReset}
								modalOpen={modalOpen}
								modalClickOpen={modalClickOpen}
								modalClose={modalClose}
							></MobileStepper>
						</Hidden>
					</React.Fragment>
				)}

				{notFound && (
					<h1> 404 - Page not found. Please return to homepage</h1>
				)}
			</Grid>
			<TransactionModal
				txState={icedTxState.txState}
				title={'Confirm in Metamask'}
				modalOpen={modalOpen}
				modalClickOpen={modalClickOpen}
				modalClose={modalClose}
				icedTxState={icedTxState}
			></TransactionModal>
		</React.Fragment>
	);
}
