/**
 * Contract deployment utilities for E2E tests
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface DeployedContract {
  packageId: string;
  publisherCap?: string;
}

/**
 * Build the Move package
 */
export function buildPackage(): void {
  try {
    console.log('Building Move package...');
    execSync('sui move build', {
      cwd: join(process.cwd(), '..'),
      stdio: 'inherit',
    });
    console.log('Build successful!');
  } catch (error) {
    throw new Error(`Failed to build package: ${error}`);
  }
}

/**
 * Get compiled modules and dependencies for deployment
 */
function getCompiledPackage(): { modules: string[]; dependencies: string[] } {
  const buildPath = join(process.cwd(), '..', 'build', 'private_publishing');

  try {
    // Read the modules bytecode
    const modulesPath = join(buildPath, 'bytecode_modules');
    const dependenciesPath = join(buildPath, 'BuildInfo.yaml');

    // For now, we'll use sui client publish which handles this automatically
    // This function structure is here for future extension if needed
    return {
      modules: [],
      dependencies: [],
    };
  } catch (error) {
    throw new Error(`Failed to read compiled package: ${error}`);
  }
}

/**
 * Deploy the contract package to the network
 * Returns the package ID and any created objects
 */
export async function deployPackage(
  client: SuiClient,
  deployer: Ed25519Keypair
): Promise<DeployedContract> {
  try {
    console.log('Deploying package...');
    console.log('Deployer address:', deployer.toSuiAddress());

    // Build the package first
    buildPackage();

    // Use sui client publish for deployment
    const packagePath = join(process.cwd(), '..');
    const deployerAddress = deployer.toSuiAddress();

    // Export the keypair for sui client to use
    const keyPath = join(process.cwd(), '.test-key');
    const keyExport = execSync(
      `echo "${deployer.getSecretKey()}" | base64`,
      { encoding: 'utf-8' }
    ).trim();

    // Use sui client publish command
    // Note: In a real implementation, we'd use the TypeScript SDK's publish functionality
    // For now, we'll create a transaction manually

    const tx = new Transaction();

    // Read compiled modules
    const modulesPath = join(process.cwd(), '..', 'build', 'private_publishing', 'bytecode_modules');
    const modules = execSync(`ls ${modulesPath}/*.mv`, { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .map(file => Array.from(readFileSync(file)));

    const dependencies = [
      '0x1', // MoveStdlib
      '0x2', // Sui framework
    ];

    const [upgradeCap] = tx.publish({
      modules: modules as any,
      dependencies,
    });

    // Transfer the upgrade capability to the deployer
    tx.transferObjects([upgradeCap], deployer.toSuiAddress());

    // Execute the transaction
    const result = await client.signAndExecuteTransaction({
      signer: deployer,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (!result.objectChanges) {
      throw new Error('No object changes in deployment transaction');
    }

    // Find the published package
    const publishedPackage = result.objectChanges.find(
      (change) => change.type === 'published'
    );

    if (!publishedPackage || publishedPackage.type !== 'published') {
      throw new Error('Package was not published successfully');
    }

    const packageId = publishedPackage.packageId;
    console.log('Package deployed successfully!');
    console.log('Package ID:', packageId);

    // Wait for the package to be fully available on-chain
    await waitForPackageAvailable(client, packageId);

    return {
      packageId,
    };
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

/**
 * Wait for a package to be available on-chain
 */
async function waitForPackageAvailable(
  client: SuiClient,
  packageId: string
): Promise<void> {
  console.log(`Waiting for package ${packageId} to be available...`);
  // Simple fixed delay to allow for package indexing
  // This is more reliable than polling for local networks
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log('Package should be ready');
}

/**
 * Get module name with package prefix
 */
export function getModuleName(packageId: string, moduleName: string): string {
  return `${packageId}::${moduleName}`;
}

/**
 * Get function name with full path
 */
export function getFunctionName(
  packageId: string,
  moduleName: string,
  functionName: string
): string {
  return `${packageId}::${moduleName}::${functionName}`;
}
