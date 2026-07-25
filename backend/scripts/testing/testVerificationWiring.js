require('dotenv').config({ path: '.env' });
const { embeddingService, indexService, verificationService } = require('../../src/services/ai');
const config = require('../../src/config/config');
const fs = require('fs/promises');
const path = require('path');

async function main() {
    console.log('Configuring dummy...');
    config.verification.enabled = true;
    config.verification.candidateCount = 3;
    
    console.log('Initializing services...');
    await embeddingService.initialise();
    await indexService.initialise();
    await verificationService.initialise();
    
    // Create dummy feature files
    const featsDir = config.verification.featuresDir;
    await fs.mkdir(featsDir, { recursive: true });
    await fs.writeFile(path.join(featsDir, 'test1.bin'), 'dummy');
    await fs.writeFile(path.join(featsDir, 'test2.bin'), 'dummy');
    
    const semanticCandidates = [
        { imageId: 'test1', similarity: 0.8 },
        { imageId: 'test2', similarity: 0.6 },
        { imageId: 'test3', similarity: 0.4 } // no feature file on purpose
    ];
    
    console.log('\nSimulating SearchService semantic ranking:');
    console.log(semanticCandidates);
    
    const queryBuffer = Buffer.from('dummy_query');
    console.log('\nRunning VerificationService...');
    const verified = await verificationService.verifyCandidates(queryBuffer, semanticCandidates);
    
    console.log('\nVerified Output:');
    console.log(JSON.stringify(verified, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
