import path from 'path';
import fs from 'fs-extra';
import semver from 'semver';
import { SQLITE_FILENAME } from '../vendor/wp-now/src/constants';
import { getWordPressVersionPath } from '../vendor/wp-now/src/download';
import getSqlitePath from '../vendor/wp-now/src/get-sqlite-path';
import { recursiveCopyDirectory } from './lib/fs-utils';
import {
	getWordPressVersionFromInstallation,
	updateLatestWordPressVersion,
} from './lib/wp-versions';
import { getResourcesPath } from './storage/paths';

// Tries to copy the app's bundled WordPress version to `wp-now` WP versions if needed
async function copyBundledLatestWPVersion() {
	const bundledWPVersionPath = path.join( getResourcesPath(), 'wp-files', 'latest', 'wordpress' );
	const bundledWPVersion = semver.coerce(
		await getWordPressVersionFromInstallation( bundledWPVersionPath )
	);
	if ( ! bundledWPVersion ) {
		return;
	}
	const latestWPVersionPath = getWordPressVersionPath( 'latest' );
	const latestWPVersion = await getWordPressVersionFromInstallation( latestWPVersionPath );
	const latestWPSemVersion = semver.coerce( latestWPVersion );
	const isBundledVersionNewer =
		latestWPVersion && latestWPSemVersion && semver.gt( bundledWPVersion, latestWPSemVersion );
	if ( ! latestWPVersion || isBundledVersionNewer ) {
		if ( isBundledVersionNewer ) {
			// We keep a copy of the latest installed version instead of removing it.
			await fs.move( latestWPVersionPath, getWordPressVersionPath( latestWPVersion ), {
				overwrite: true,
			} );
		}
		console.log( `Copying bundled WP version ${ bundledWPVersion } as 'latest' version...` );
		await recursiveCopyDirectory( bundledWPVersionPath, latestWPVersionPath );
	}
}

async function copyBundledSqlite() {
	const isSqliteInstalled = await fs.pathExists( getSqlitePath() );
	if ( isSqliteInstalled ) {
		return;
	}
	const bundledSqlitePath = path.join( getResourcesPath(), 'wp-files', SQLITE_FILENAME );
	console.log( `Copying bundled SQLite...` );
	await recursiveCopyDirectory( bundledSqlitePath, getSqlitePath() );
}

export default async function setupWPServerFiles() {
	await copyBundledLatestWPVersion();
	await copyBundledSqlite();
	await updateLatestWordPressVersion();
}