import * as Promise from 'bluebird';

type Callback = (err: Error) => void;

/**
 * management function. Prevents a function from being called to often
 * and, for function returning a promise it ensures that it's not run
 * again (through this Debouncer) before the promise is resolved.
 * 
 * @class Debouncer
 */
class Debouncer {
  private mDebounceMS: number;
  private mFunc: (...args: any[]) => Error | Promise<void>;
  private mTimer: NodeJS.Timer;

  private mCallbacks: Callback[] = [];
  private mAddCallbacks: Callback[] = [];
  private mRunning: boolean = false;
  private mReschedule: 'no' | 'yes' | 'immediately' = 'no';
  private mArgs: any[] = [];

  constructor(func: (...args: any[]) => Error | Promise<void>, debounceMS: number) {
    this.mFunc = func;
    this.mDebounceMS = debounceMS;
  }

  /**
   * schedule the function and invoke the callback once that is done
   * @param callback the callback to invoke upon completion
   * @param args the arguments to pass to the function. When the timer expires
   *             and the function actually gets invoked, only the last set of
   *             parameters will be used
   */
  public schedule(callback: (err: Error) => void, ...args: any[]) {
    if (this.mTimer !== undefined) {
      clearTimeout(this.mTimer);
    }

    if ((callback !== undefined) && (callback !== null)) {
      this.mCallbacks.push(callback);
    }

    this.mArgs = args;

    if (this.mRunning) {
      if (this.mReschedule !== 'immediately') {
        this.mReschedule = 'yes';
      }
    } else {
      this.startTimer();
    }
  }

  /**
   * run the function immediately without waiting for the timer
   * to run out. (It does cancel the timer though and invokes all
   * scheduled timeouts)
   * 
   * @param {(err: Error) => void} callback 
   * @param {...any[]} args 
   * 
   * @memberOf Debouncer
   */
  public runNow(callback: (err: Error) => void, ...args: any[]) {
    if (this.mTimer !== undefined) {
      clearTimeout(this.mTimer);
    }

    if ((callback !== undefined) && (callback !== null)) {
      this.mCallbacks.push(callback);
    }

    this.mArgs = args;

    if (this.mRunning) {
      this.mReschedule = 'immediately';
    } else {
      this.run();
    }
  }

  /**
   * wait for the completion of the current timer without scheduling it.
   * if the function is not scheduled currently the callback will be
   * called (as a success) immediately.
   * This does not reset the timer
   * 
   * @param {(err: Error) => void} callback 
   * @param {boolean} immediately if set (default is false) the function gets called
   *                              immediately instead of awaiting the timer
   * 
   * @memberOf Debouncer
   */
  public wait(callback: (err: Error) => void, immediately: boolean = false) {
    if ((this.mTimer === undefined) && !this.mRunning) {
      // not scheduled
      return callback(null);
    }

    this.mAddCallbacks.push(callback);

    if (immediately && !this.mRunning)  {
      clearTimeout(this.mTimer);

      this.run();
    }
  }

  public clear() {
    clearTimeout(this.mTimer);
    this.mTimer = undefined;
  }

  private run() {
    this.mRunning = true;
    let callbacks = this.mCallbacks;
    this.mCallbacks = [];
    let args = this.mArgs;
    this.mArgs = [];
    this.mTimer = undefined;

    let prom: Error | Promise<void> = this.mFunc(...args);
    if (prom instanceof Promise) {
      prom.then(() => this.invokeCallbacks(callbacks, null))
          .catch((err: Error) => this.invokeCallbacks(callbacks, err))
          .finally(() => {
            this.mRunning = false;
            if (this.mReschedule === 'immediately') {
              this.mReschedule = 'no';
              this.run();
            } else if (this.mReschedule === 'yes') {
              this.mReschedule = 'no';
              this.schedule(undefined);
            }
          });
    } else {
      this.mRunning = false;
      this.invokeCallbacks(callbacks, prom as Error);
    }
  }

  private invokeCallbacks(localCallbacks: Callback[], err: Error) {
    localCallbacks.forEach((cb) => cb(err));
    this.mAddCallbacks.forEach((cb) => cb(err));
    this.mAddCallbacks = [];
  }

  private startTimer() {
    this.mTimer = setTimeout(() => this.run(), this.mDebounceMS);
  }
}

export default Debouncer;