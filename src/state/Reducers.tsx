// Import Interfaces
import {
	ConditionOrAction,
	WhitelistData,
	IcedTx,
	Action
} from '../constants/interfaces';
import { findCondition, findAction } from '../helpers/helpers';
import {
	DEFAULT_DATA,
	RESET_CONDITION,
	SELECT_CONDITION,
	SELECT_ACTION,
	UPDATE_ACTION_INPUTS,
	UPDATE_CONDITION_INPUTS,
	RESET_ACTION
} from '../constants/constants';
import { DEFAULT_ICED_TX } from './GlobalState';

function updateIcedTxCondition(
	state: IcedTx,
	conditionOrAction: ConditionOrAction,
	id: string
) {
	let varName = '';
	let updatedData: WhitelistData = DEFAULT_DATA;
	if (conditionOrAction === ConditionOrAction.Condition) {
		updatedData = findCondition(id);
		varName = 'condition';
	} else if (conditionOrAction === ConditionOrAction.Action) {
		updatedData = findAction(id);
		varName = 'action';
	}
	return { ...state, [varName]: updatedData };
	// setData({...data, [varName]: updatedData})
}

function updateUserInput(
	state: IcedTx,
	index: number,
	value: any,
	conditionOrAction: ConditionOrAction
) {
	// Update userInputArray
	const stateCopy = state;
	if (conditionOrAction === ConditionOrAction.Condition) {
		stateCopy.condition.userInputs[index] = value;
	} else {
		stateCopy.action.userInputs[index] = value;
	}
	return stateCopy;
}

function resetIcedTx(state: IcedTx, conditionOrAction: ConditionOrAction) {
	const stateCopy = state;
	if (conditionOrAction === ConditionOrAction.Condition) {
		stateCopy.condition = DEFAULT_DATA;
	} else if (conditionOrAction === ConditionOrAction.Action) {
		stateCopy.action = DEFAULT_DATA;
	}
	// console.log("reset")
	return stateCopy;
}

/*

export const RESET_CONDITION = 'RESET_CONDITION';
export const RESET_ACTION = 'RESET_ACTION';
export const UPDATE_ACTION_INPUTS = 'UPDATE_ACTION_INPUTS';
export const UPDATE_CONDITION_INPUTS = 'UPDATE_CONDITION_INPUTS';
export const SELECT_CONDITION = 'SELECT_CONDITION';
export const SELECT_ACTION = 'SELECT_ACTION';
*/

// Reducer function
export const icedTxReducer = (state: IcedTx, action: Action) => {
	switch (action.type) {
		case SELECT_CONDITION:
			return updateIcedTxCondition(
				state,
				ConditionOrAction.Condition,
				action.id
			);
		case SELECT_ACTION:
			return updateIcedTxCondition(
				state,
				ConditionOrAction.Action,
				action.id
			);
		case UPDATE_CONDITION_INPUTS:
			return updateUserInput(
				state,
				action.index,
				action.value,
				ConditionOrAction.Condition
			);
		case UPDATE_ACTION_INPUTS:
			return updateUserInput(
				state,
				action.index,
				action.value,
				ConditionOrAction.Action
			);
		case RESET_CONDITION:
			return resetIcedTx(state, ConditionOrAction.Condition);
		case RESET_ACTION:
			return resetIcedTx(state, ConditionOrAction.Action);
		// case ADD_USER_INPUT:
		// 	return updateUserInput(
		// 		state,
		// 		action.index,
		// 		action.value,
		// 		action.conditionOrAction
		// 	);
		// case RESET_ACTION_CONDITION_TO_DEFAULT:
		// 	return resetIcedTx(action.conditionOrAction, state);
		// default:
		// 	return state;
	}
};
