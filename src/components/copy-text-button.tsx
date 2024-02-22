import { Icon, copy } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { useCallback, useState } from 'react';
import { cx } from '../lib/cx';
import { getIpcApi } from '../lib/get-ipc-api';

interface CopyTextButtonProps {
	text: string;
	label?: string;
	className?: string;
	copyConfirmation?: string;
	timeoutConfirmation?: number;
	children?: React.ReactNode;
}

export function CopyTextButton( {
	text,
	label,
	className,
	copyConfirmation,
	timeoutConfirmation = 2000,
	children,
}: CopyTextButtonProps ) {
	const { __ } = useI18n();
	const [ showCopied, setShowCopied ] = useState( false );
	const [ timeoutId, setTimeoutId ] = useState< NodeJS.Timeout | null >( null );

	const onClick = useCallback( () => {
		getIpcApi().copyText( text );
		setShowCopied( true );
		if ( timeoutId ) {
			clearTimeout( timeoutId );
		}
		setTimeoutId( setTimeout( () => setShowCopied( false ), timeoutConfirmation ) );
	}, [ text, timeoutConfirmation, timeoutId ] );

	return (
		<button
			className={ cx(
				'flex items-center cursor-default hover:text-blue-600',
				showCopied && 'text-blue-600',
				className
			) }
			aria-label={ label || __( 'copy to clipboard' ) }
			onClick={ onClick }
		>
			{ children }
			<Icon className="ml-1.5 mr-1" fill="currentColor" size={ 13 } icon={ copy } />
			{ showCopied && copyConfirmation }
		</button>
	);
}