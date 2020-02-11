import React, { useEffect } from 'react';

// Routing
import { useHistory } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { useIcedTxContext, connectorsByName } from '../../state/GlobalState';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import SendIcon from '@material-ui/icons/Send';
import WarningIcon from '@material-ui/icons/Warning';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import { ReactComponent as MetamaskLogo } from './metamask_logo.svg';

import {
	COLOURS,
	SELECTED_CHAIN_ID,
	UPDATE_TX_STATE,
	OPEN_MODAL,
	RESET_CONDITION,
	RESET_ACTION,
	SELECT_CONDITION,
	DEFAULT_TRIGGER_ID,
	INPUT_OK
} from '../../constants/constants';
import { TxState } from '../../constants/interfaces';

import { injected } from '../../constants/connectors';
import { AbstractConnector } from '@web3-react/abstract-connector';

const StyledMenu = withStyles({
	paper: {
		border: '1px solid #d3d4d5'
	}
})((props: MenuProps) => (
	<Menu
		elevation={0}
		getContentAnchorEl={null}
		anchorOrigin={{
			vertical: 'bottom',
			horizontal: 'center'
		}}
		transformOrigin={{
			vertical: 'top',
			horizontal: 'center'
		}}
		{...props}
	/>
));

const StyledMenuItem = withStyles(theme => ({
	root: {
		'&:focus': {
			backgroundColor: theme.palette.primary.main,
			'& .MuiListItemIcon-root, & .MuiListItemText-primary': {
				color: theme.palette.common.white
			}
		}
	}
}))(MenuItem);

const GelatoButton = withStyles({
	root: {
		// minWidth: '150px',
		boxShadow: 'none',
		textTransform: 'none',
		fontSize: 18,
		padding: '6px 12px',
		marginLeft: '16px',
		lineHeight: 1.5,
		border: '0.5px solid',
		borderColor: COLOURS.salmon,
		// borderRadius: '1px 1px 1px 1px',
		color: 'white',

		'&:hover': {
			backgroundColor: COLOURS.salmon50,
			borderColor: 'white',
			boxShadow: 'none'
		},
		'&:active': {
			boxShadow: 'none',
			backgroundColor: '#0062cc',
			borderColor: '#005cbf'
		}
		// '&:focus': {
		// 	boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)'
		// }
	}
})(Button);

// interface LoginButtonProps {
// 	handleProfileMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
// 	handleMobileMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
// }

export default function Web3ConnectButton() {
	const { account, active, activate, deactivate, chainId } = useWeb3React();
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const history = useHistory();
	const { dispatch } = useIcedTxContext();

	const { icedTxState } = useIcedTxContext();

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const linkBackToHome = () => {
		dispatch({ type: RESET_CONDITION });
		dispatch({ type: RESET_ACTION });
		dispatch({
			type: INPUT_OK,
			txState: TxState.displayInstallMetamask
		});
		history.push('/');
	};

	const checkIfMetamaskInstalled = () => {
		let isInstalled = false;
		icedTxState.txState !== TxState.displayInstallMetamask
			? (isInstalled = true)
			: (isInstalled = false);
		return isInstalled;
	};

	const handleConnect = async (connector: AbstractConnector) => {
		await activate(connector, (error: Error) => {
			console.log(error);
		});
	};

	return (
		<div>
			<GelatoButton
				aria-controls="customized-menu"
				aria-haspopup="true"
				onClick={handleClick}
				// endIcon={<ArrowDropDownIcon />}
			>
				{'Connect Wallet'}
			</GelatoButton>
			<StyledMenu
				id="customized-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleClose}
			>
				<StyledMenuItem
					onClick={() => {
						if (checkIfMetamaskInstalled()) {
							handleConnect(connectorsByName.Injected);
						} else {
							// Open modal to show please install Metamask
							dispatch({
								type: OPEN_MODAL
							});
						}
					}}
				>
					{/* <span style={{ minWidth: '56px' }}>🤖</span> */}
					<img
						style={{ width: '24px', marginRight: '40px' }}
						src="/images/metamask_logo.svg"
					></img>
					{/* <MetamaskLogo style={{ width: '56px' }}></MetamaskLogo> */}

					<ListItemText primary="Metamask" />
				</StyledMenuItem>
				<StyledMenuItem
					onClick={() => {
						handleConnect(connectorsByName.WalletConnect);
					}}
				>
					{/* <span style={{ minWidth: '56px' }}>👋</span> */}
					<img
						style={{ width: '24px', marginRight: '40px' }}
						src="/images/wallet_connect_logo.svg"
					></img>

					{/* <ListItemIcon>
						<DraftsIcon fontSize="small" />
					</ListItemIcon> */}
					<ListItemText primary="Wallet Connect" />
				</StyledMenuItem>
			</StyledMenu>
		</div>
	);
	// else if (active && chainId !== SELECTED_CHAIN_ID)
	// 	return <ButtonWhenWrongNetwork></ButtonWhenWrongNetwork>;
	// else return <ButtonToLogIn></ButtonToLogIn>;
}