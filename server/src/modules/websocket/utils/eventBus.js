import { EventEmitter } from 'events';
import logger from '../../../config/logger.js';

/**
 * Centralized Internal Event Bus
 * Uses Node's EventEmitter for high-performance in-process communication.
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.on('error', (error) => {
      logger.error({ error: error.message }, 'EventBus Error');
    });
  }

  emit(event, ...args) {
    const status = super.emit(event, ...args);
    if (!status) {
      // logger.debug({ event }, 'Event emitted but no listeners found');
    }
    return status;
  }
}

export default new EventBus();
