const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// In-memory Map to track import jobs.
// Key: jobId, Value: Job Object
const activeJobs = new Map();

/**
 * Creates a new background import job.
 * @param {string} type - "images" or "zip"
 * @param {number} initialTotalFiles - Initial count of files (can be updated later for ZIPs).
 * @returns {string} jobId
 */
function createJob(type, initialTotalFiles = 0) {
  const jobId = uuidv4();
  
  const job = {
    id: jobId,
    type, // 'images' or 'zip'
    status: 'pending', // 'pending', 'running', 'completed', 'failed'
    totalFiles: initialTotalFiles,
    processedFiles: 0,
    successfulImports: 0,
    failedImports: 0,
    currentFilename: null,
    failures: [], // Array of { filename, reason }
    startTime: new Date().toISOString(),
    endTime: null,
    error: null
  };
  
  activeJobs.set(jobId, job);
  logger.info(`[ImportJobService] Created new job: ${jobId} of type ${type}`);
  return jobId;
}

/**
 * Retrieves a job by ID.
 * @param {string} jobId 
 * @returns {Object|null} job
 */
function getJob(jobId) {
  return activeJobs.get(jobId) || null;
}

/**
 * Updates a job's progress.
 * @param {string} jobId 
 * @param {Object} updates - Properties to merge into the job.
 */
function updateJobProgress(jobId, updates) {
  const job = activeJobs.get(jobId);
  if (!job) {
    logger.warn(`[ImportJobService] Attempted to update non-existent job: ${jobId}`);
    return;
  }

  // Handle specific increment updates if provided (e.g. { incProcessedFiles: 1 })
  if (updates.incProcessedFiles) {
    job.processedFiles += updates.incProcessedFiles;
    delete updates.incProcessedFiles;
  }
  if (updates.incSuccessfulImports) {
    job.successfulImports += updates.incSuccessfulImports;
    delete updates.incSuccessfulImports;
  }
  if (updates.incFailedImports) {
    job.failedImports += updates.incFailedImports;
    delete updates.incFailedImports;
  }
  if (updates.addFailure) {
    job.failures.push(updates.addFailure);
    delete updates.addFailure;
  }

  // Merge the rest of the updates
  Object.assign(job, updates);

  // Determine if status should change to completed based on processedFiles
  if (job.status === 'running' && job.processedFiles >= job.totalFiles && job.totalFiles > 0) {
     job.status = 'completed';
     job.endTime = new Date().toISOString();
     logger.info(`[ImportJobService] Job ${jobId} completed auto-detected (processed ${job.processedFiles}/${job.totalFiles})`);
  }
}

/**
 * Gets all currently active (pending or running) jobs.
 * @returns {Array} Array of job objects.
 */
function getActiveJobs() {
  const jobs = Array.from(activeJobs.values());
  return jobs.filter(job => job.status === 'pending' || job.status === 'running');
}

module.exports = {
  createJob,
  getJob,
  updateJobProgress,
  getActiveJobs
};
