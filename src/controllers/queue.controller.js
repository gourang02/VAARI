const queueService = require('../services/queue.service');
const { success } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');

const startQueue = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.body.doctorId;
    const { slotId, date } = req.body;
    
    if (!slotId || !date) {
      throw new ApiError(400, 'slotId and date are required');
    }
    
    const queue = await queueService.startQueue(doctorId, slotId, date);
    return success(res, queue, 'Queue started');
  } catch (error) {
    next(error);
  }
};

const nextPatient = async (req, res, next) => {
  try {
    const { queueId } = req.body;
    if (!queueId) throw new ApiError(400, 'queueId is required');
    
    const result = await queueService.nextToken(queueId);
    return success(res, result, 'Moved to next patient');
  } catch (error) {
    next(error);
  }
};

const skipPatient = async (req, res, next) => {
  try {
    const { queueId } = req.body;
    if (!queueId) throw new ApiError(400, 'queueId is required');
    
    const result = await queueService.skipToken(queueId);
    return success(res, result, 'Patient skipped');
  } catch (error) {
    next(error);
  }
};

const pauseQueue = async (req, res, next) => {
  try {
    const { queueId } = req.body;
    if (!queueId) throw new ApiError(400, 'queueId is required');
    
    const queue = await queueService.pauseQueue(queueId);
    return success(res, queue, 'Queue paused');
  } catch (error) {
    next(error);
  }
};

const resumeQueue = async (req, res, next) => {
  try {
    const { queueId } = req.body;
    if (!queueId) throw new ApiError(400, 'queueId is required');
    
    const queue = await queueService.resumeQueue(queueId);
    return success(res, queue, 'Queue resumed');
  } catch (error) {
    next(error);
  }
};

const getLiveQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const queueState = await queueService.getQueueState(doctorId, targetDate);
    return success(res, queueState, 'Live queue state retrieved');
  } catch (error) {
    next(error);
  }
};

const getPatientPosition = async (req, res, next) => {
  try {
    const { doctorId, bookingId } = req.params;
    const position = await queueService.getPatientPosition(doctorId, bookingId);
    return success(res, position, 'Patient position retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startQueue,
  nextPatient,
  skipPatient,
  pauseQueue,
  resumeQueue,
  getLiveQueue,
  getPatientPosition
};
