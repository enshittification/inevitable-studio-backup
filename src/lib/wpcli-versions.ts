import fs from 'fs-extra';
import semver from 'semver';
import { downloadWpCli } from '../../vendor/wp-now/src/download';
import { executeWPCli } from '../../vendor/wp-now/src/execute-wp-cli';
import getWpCliPath from '../../vendor/wp-now/src/get-wp-cli-path';

export async function updateLatestWPCliVersion() {
	let shouldOverwrite = false;
	const pathExist = await fs.pathExists( getWpCliPath() );
	if ( pathExist ) {
		shouldOverwrite = await isWPCliInstallationOutdated();
	}
	await downloadWpCli( shouldOverwrite );
}

export async function isWPCliInstallationOutdated(): Promise< boolean > {
	const installedVersion = await getWPCliVersionFromInstallation();
	const latestVersion = await getLatestWPCliVersion();

	if ( ! installedVersion ) {
		return true;
	}

	if ( ! latestVersion ) {
		return false;
	}

	try {
		return semver.lt( installedVersion, latestVersion );
	} catch ( _error ) {
		return false;
	}
}

let latestWPCliVersionCache: string | null = null;

async function getLatestWPCliVersion() {
	// Only fetch the latest version once per app session
	if ( latestWPCliVersionCache ) {
		return latestWPCliVersionCache;
	}

	try {
		const response = await fetch(
			'https://api.github.com/repos/wp-cli/wp-cli/releases?per_page=1'
		);
		const data: Record< string, string >[] = await response.json();
		latestWPCliVersionCache = data?.[ 0 ]?.tag_name || '';
	} catch ( _error ) {
		// Discard the failed fetch, return the cache
	}

	return latestWPCliVersionCache || '';
}

export const getWPCliVersionFromInstallation = async () => {
	const { stdout } = await executeWPCli( '.', [ '--version' ] );
	if ( stdout?.startsWith( 'WP-CLI ' ) ) {
		const version = stdout.split( ' ' )[ 1 ];
		if ( ! version ) {
			return '';
		}
		return `v${ version }`;
	}
	return '';
};
