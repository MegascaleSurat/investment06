export const TradeState = {
  NEW: 'NEW',
  WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
  READY: 'READY',
  ORDER_PLACED: 'ORDER_PLACED',
  ACTIVE: 'ACTIVE',
  TRAILING: 'TRAILING',
  EXIT_TRIGGERED: 'EXIT_TRIGGERED',
  CLOSED: 'CLOSED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
};

export const VALID_TRANSITIONS = {
  [TradeState.NEW]: [TradeState.WAITING_CONFIRMATION, TradeState.BLOCKED],
  [TradeState.WAITING_CONFIRMATION]: [TradeState.READY, TradeState.BLOCKED, TradeState.NEW],
  [TradeState.READY]: [TradeState.ORDER_PLACED, TradeState.BLOCKED],
  [TradeState.ORDER_PLACED]: [TradeState.ACTIVE, TradeState.FAILED, TradeState.BLOCKED],
  [TradeState.ACTIVE]: [TradeState.TRAILING, TradeState.EXIT_TRIGGERED, TradeState.FAILED],
  [TradeState.TRAILING]: [TradeState.EXIT_TRIGGERED, TradeState.FAILED],
  [TradeState.EXIT_TRIGGERED]: [TradeState.CLOSED, TradeState.FAILED],
  [TradeState.CLOSED]: [],
  [TradeState.BLOCKED]: [TradeState.NEW],
  [TradeState.FAILED]: [TradeState.NEW],
};

/**
 * Validates if a state transition is allowed
 * @param {string} from 
 * @param {string} to 
 * @returns {boolean}
 */
export const isValidTransition = (from, to) => {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};
